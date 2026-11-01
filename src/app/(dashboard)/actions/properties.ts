"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canAccessProperty, requireRole, assertCanAccessProperty } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { toMinor } from "@/lib/money";
import { propertySchema, unitSchema } from "@/lib/validations/property";
import {
  isPhotoContentType,
  MAX_PHOTO_UPLOAD_BYTES,
  PHOTO_LIMITS,
  photoExtension,
} from "@/lib/photo-upload";
import type { Role } from "@/generated/prisma/client";

// ─── Slug generation ─────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(base);
  let slug = baseSlug;
  let i = 1;
  while (true) {
    const existing = await prisma.property.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}

// ─── Property actions ─────────────────────────────────────────────────────────

export async function createProperty(data: unknown) {
  const user = await requireRole(["OWNER", "ADMIN"]);

  const parsed = propertySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, city, ...rest } = parsed.data;
  const slug = await uniqueSlug(`${name} ${city}`);

  const property = await prisma.property.create({
    data: {
      ...rest,
      name,
      city,
      slug,
      ownerId: user.id,
      images: [],
      isPublished: false,
    },
  });

  await logActivity({
    actorId: user.id,
    action: "PROPERTY_CREATED",
    entityType: "Property",
    entityId: property.id,
    metadata: { name: property.name, slug: property.slug },
  });

  revalidatePath("/owner/properties");
  revalidatePath("/admin/properties");
  redirect(`/owner/properties/${property.id}`);
}

export async function updateProperty(propertyId: string, data: unknown) {
  const user = await requireRole(["OWNER", "ADMIN"]);
  await assertCanAccessProperty(user, propertyId);

  const parsed = propertySchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, city, ...rest } = parsed.data;

  const current = await prisma.property.findUnique({ where: { id: propertyId }, select: { slug: true, name: true, city: true } });
  const nameOrCityChanged = current?.name !== name || current?.city !== city;
  const slug = nameOrCityChanged ? await uniqueSlug(`${name} ${city}`, propertyId) : current!.slug;

  await prisma.property.update({
    where: { id: propertyId },
    data: { ...rest, name, city, slug },
  });

  await logActivity({
    actorId: user.id,
    action: "PROPERTY_UPDATED",
    entityType: "Property",
    entityId: propertyId,
    metadata: { name },
  });

  revalidatePath(`/owner/properties/${propertyId}`);
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/owner/properties");
  revalidatePath("/admin/properties");
  return { success: true };
}

export async function togglePublish(propertyId: string) {
  const user = await requireRole(["OWNER", "ADMIN"]);
  await assertCanAccessProperty(user, propertyId);

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { isPublished: true, name: true },
  });
  if (!property) return { success: false, error: "Property not found." };

  const newState = !property.isPublished;
  await prisma.property.update({ where: { id: propertyId }, data: { isPublished: newState } });

  await logActivity({
    actorId: user.id,
    action: newState ? "PROPERTY_PUBLISHED" : "PROPERTY_UNPUBLISHED",
    entityType: "Property",
    entityId: propertyId,
    metadata: { name: property.name },
  });

  revalidatePath(`/owner/properties/${propertyId}`);
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/owner/properties");
  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  return { success: true, isPublished: newState };
}

export async function deleteProperty(propertyId: string) {
  const user = await requireRole(["OWNER", "ADMIN"]);
  await assertCanAccessProperty(user, propertyId);

  const unitsWithLeases = await prisma.unit.count({
    where: { propertyId, leases: { some: {} } },
  });
  if (unitsWithLeases > 0) {
    return { success: false, error: "Cannot delete a property that has units with active or historical leases." };
  }

  const property = await prisma.property.delete({ where: { id: propertyId } });

  await logActivity({
    actorId: user.id,
    action: "PROPERTY_DELETED",
    entityType: "Property",
    entityId: propertyId,
    metadata: { name: property.name },
  });

  revalidatePath("/owner/properties");
  revalidatePath("/admin/properties");
  redirect(user.activeRole === "ADMIN" ? "/admin/properties" : "/owner/properties");
}

// ─── Unit actions ─────────────────────────────────────────────────────────────

export async function createUnit(propertyId: string, data: unknown) {
  const user = await requireRole(["OWNER", "ADMIN"]);
  await assertCanAccessProperty(user, propertyId);

  const parsed = unitSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { rentAmount, ...rest } = parsed.data;
  const rentMinor = toMinor(rentAmount);

  const unit = await prisma.unit.create({
    data: {
      ...rest,
      propertyId,
      rentAmount: rentMinor,
      images: [],
      features: rest.features ?? [],
    },
  });

  await logActivity({
    actorId: user.id,
    action: "UNIT_CREATED",
    entityType: "Unit",
    entityId: unit.id,
    metadata: { name: unit.name, propertyId },
  });

  revalidatePath(`/owner/properties/${propertyId}`);
  revalidatePath(`/admin/properties/${propertyId}`);
  return { success: true, unitId: unit.id };
}

export async function updateUnit(unitId: string, data: unknown) {
  const user = await requireRole(["OWNER", "ADMIN"]);
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      ...(user.activeRole === "OWNER" ? { property: { ownerId: user.id } } : {}),
    },
    select: { propertyId: true },
  });
  if (!unit) return { success: false, error: "Unit not found." };

  await assertCanAccessProperty(user, unit.propertyId);

  const parsed = unitSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Validation failed.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { rentAmount, ...rest } = parsed.data;
  const rentMinor = toMinor(rentAmount);

  await prisma.unit.update({
    where: { id: unitId },
    data: { ...rest, rentAmount: rentMinor, features: rest.features ?? [] },
  });

  await logActivity({
    actorId: user.id,
    action: "UNIT_UPDATED",
    entityType: "Unit",
    entityId: unitId,
    metadata: { name: rest.name, propertyId: unit.propertyId },
  });

  revalidatePath(`/owner/properties/${unit.propertyId}`);
  revalidatePath(`/admin/properties/${unit.propertyId}`);
  return { success: true };
}

export async function deleteUnit(unitId: string) {
  const user = await requireRole(["OWNER", "ADMIN"]);
  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      ...(user.activeRole === "OWNER" ? { property: { ownerId: user.id } } : {}),
    },
    select: { propertyId: true, name: true, _count: { select: { leases: true, maintenanceRequests: true } } },
  });
  if (!unit) return { success: false, error: "Unit not found." };

  await assertCanAccessProperty(user, unit.propertyId);

  if (unit._count.leases > 0 || unit._count.maintenanceRequests > 0) {
    return { success: false, error: "Cannot delete a unit that has leases or maintenance requests." };
  }

  await prisma.unit.delete({ where: { id: unitId } });

  await logActivity({
    actorId: user.id,
    action: "UNIT_DELETED",
    entityType: "Unit",
    entityId: unitId,
    metadata: { name: unit.name, propertyId: unit.propertyId },
  });

  revalidatePath(`/owner/properties/${unit.propertyId}`);
  revalidatePath(`/admin/properties/${unit.propertyId}`);
  return { success: true };
}

// ─── Photo upload actions ─────────────────────────────────────────────────────

type PhotoTargetRecord =
  | { kind: "property"; id: string; images: string[] }
  | { kind: "unit"; id: string; images: string[] };

async function loadPhotoTarget(
  propertyId: string,
  target: "property" | "unit",
  targetId?: string
): Promise<PhotoTargetRecord | null> {
  if (target === "property") {
    if (targetId && targetId !== propertyId) return null;
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { images: true },
    });
    return property ? { kind: "property", id: propertyId, images: property.images } : null;
  }

  if (target === "unit" && targetId) {
    const unit = await prisma.unit.findFirst({
      where: { id: targetId, propertyId },
      select: { images: true },
    });
    return unit ? { kind: "unit", id: targetId, images: unit.images } : null;
  }

  return null;
}

async function storePhotoTargetImages(
  propertyId: string,
  target: PhotoTargetRecord,
  images: string[]
): Promise<boolean> {
  const where =
    target.kind === "property"
      ? { id: target.id, images: { equals: target.images } }
      : { id: target.id, propertyId, images: { equals: target.images } };
  const result =
    target.kind === "property"
      ? await prisma.property.updateMany({ where, data: { images } })
      : await prisma.unit.updateMany({ where, data: { images } });
  return result.count === 1;
}

async function canManagePhotoTarget(
  user: { id: string; activeRole?: Role; role?: Role; roles?: Role[] },
  propertyId: string,
  target: "property" | "unit",
  targetId?: string
): Promise<PhotoTargetRecord | null> {
  if (!(await canAccessProperty(user, propertyId))) return null;
  return loadPhotoTarget(propertyId, target, targetId);
}

// REQUIRED SUPABASE DASHBOARD CONFIGURATION:
// Signed upload URLs do not enforce file size or content type by themselves.
// Configure property-images with a 5 MB file size limit and allowed MIME types
// image/jpeg, image/png, and image/webp.
export async function getPhotoUploadUrl(
  propertyId: string,
  target: "property" | "unit",
  targetId: string | undefined,
  contentType: string,
  fileSize: number
) {
  const user = await requireRole(["OWNER", "ADMIN", "CARETAKER"]);
  if (!isPhotoContentType(contentType) || !Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > MAX_PHOTO_UPLOAD_BYTES) {
    return { success: false as const, error: "Invalid photo upload." };
  }

  const photoTarget = await canManagePhotoTarget(user, propertyId, target, targetId);
  if (!photoTarget) return { success: false as const, error: "Unable to upload photo." };
  const limit = PHOTO_LIMITS[photoTarget.kind];
  if (photoTarget.images.length >= limit) {
    return { success: false as const, error: `Maximum ${limit} photos per ${photoTarget.kind}.` };
  }

  const { createSignedUploadUrl } = await import("@/lib/storage");
  const { v4: uuidv4 } = await import("uuid");
  const subfolder = photoTarget.kind === "unit" ? `units/${photoTarget.id}` : "cover";
  const uploadId = `${uuidv4()}.${photoExtension(contentType)}`;
  const filePath = `properties/${propertyId}/${subfolder}/${uploadId}`;

  const signed = await createSignedUploadUrl(filePath);
  return { success: true as const, ...signed, uploadId };
}

export async function confirmPhotoUpload(
  propertyId: string,
  uploadId: string,
  target: "property" | "unit",
  targetId?: string
) {
  const user = await requireRole(["OWNER", "ADMIN", "CARETAKER"]);
  const photoTarget = await canManagePhotoTarget(user, propertyId, target, targetId);
  if (!photoTarget || typeof uploadId !== "string") {
    return { success: false, error: "Unable to confirm photo upload." };
  }

  const expectedPrefix =
    photoTarget.kind === "unit"
      ? `properties/${propertyId}/units/${photoTarget.id}/`
      : `properties/${propertyId}/cover/`;
  if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}\.(?:jpg|png|webp)$/i.test(uploadId)) {
    return { success: false, error: "Unable to confirm photo upload." };
  }
  const filePath = `${expectedPrefix}${uploadId}`;
  const { getStorageObjectMetadata, getPublicStorageUrl } = await import("@/lib/storage");
  const metadata = await getStorageObjectMetadata(filePath);
  if (
    !metadata ||
    !isPhotoContentType(metadata.contentType) ||
    !Number.isSafeInteger(metadata.size) ||
    metadata.size <= 0 ||
    metadata.size > MAX_PHOTO_UPLOAD_BYTES ||
    uploadId.slice(uploadId.lastIndexOf(".") + 1).toLowerCase() !== photoExtension(metadata.contentType)
  ) {
    return { success: false, error: "Unable to confirm photo upload." };
  }

  const limit = PHOTO_LIMITS[photoTarget.kind];
  if (photoTarget.images.length >= limit) {
    return { success: false, error: `Maximum ${limit} photos per ${photoTarget.kind}.` };
  }

  const publicUrl = getPublicStorageUrl(filePath);
  if (photoTarget.images.includes(publicUrl)) {
    return { success: false, error: "Unable to confirm photo upload." };
  }
  const stored = await storePhotoTargetImages(propertyId, photoTarget, [...photoTarget.images, publicUrl]);
  if (!stored) {
    return { success: false, error: "Unable to confirm photo upload." };
  }

  await logActivity({
    actorId: user.id,
    action: "PHOTO_UPLOADED",
    entityType: target === "unit" ? "Unit" : "Property",
    entityId: targetId || propertyId,
    metadata: { target },
  });

  revalidatePath(`/owner/properties/${propertyId}`);
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath(`/caretaker/properties/${propertyId}`);
  return { success: true, url: publicUrl };
}

export async function deletePhoto(
  propertyId: string,
  photoUrl: string,
  target: "property" | "unit",
  targetId?: string
) {
  const user = await requireRole(["OWNER", "ADMIN", "CARETAKER"]);
  const photoTarget = await canManagePhotoTarget(user, propertyId, target, targetId);
  if (!photoTarget || typeof photoUrl !== "string" || !photoTarget.images.includes(photoUrl)) {
    return { success: false, error: "Unable to delete photo." };
  }

  const { getStoragePathFromPublicUrl, deleteStorageObject } = await import("@/lib/storage");
  const storagePath = getStoragePathFromPublicUrl(photoUrl);
  if (!storagePath) return { success: false, error: "Unable to delete photo." };

  const updatedImages = photoTarget.images.filter((image) => image !== photoUrl);
  if (!(await storePhotoTargetImages(propertyId, photoTarget, updatedImages))) {
    return { success: false, error: "Unable to delete photo." };
  }

  try {
    await deleteStorageObject(storagePath);
  } catch {
    console.warn("Could not delete storage object.");
  }

  await logActivity({
    actorId: user.id,
    action: "PHOTO_DELETED",
    entityType: target === "unit" ? "Unit" : "Property",
    entityId: targetId || propertyId,
    metadata: { target },
  });

  revalidatePath(`/owner/properties/${propertyId}`);
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath(`/caretaker/properties/${propertyId}`);
  return { success: true };
}

export async function reorderPhotos(
  propertyId: string,
  newOrder: string[],
  target: "property" | "unit",
  targetId?: string
) {
  const user = await requireRole(["OWNER", "ADMIN", "CARETAKER"]);
  const photoTarget = await canManagePhotoTarget(user, propertyId, target, targetId);
  if (
    !photoTarget ||
    !Array.isArray(newOrder) ||
    newOrder.length !== photoTarget.images.length ||
    new Set(newOrder).size !== newOrder.length ||
    newOrder.some((image) => typeof image !== "string" || !photoTarget.images.includes(image))
  ) {
    return { success: false, error: "Unable to reorder photos." };
  }

  if (!(await storePhotoTargetImages(propertyId, photoTarget, newOrder))) {
    return { success: false, error: "Unable to reorder photos." };
  }

  revalidatePath(`/owner/properties/${propertyId}`);
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath(`/caretaker/properties/${propertyId}`);
  return { success: true };
}
