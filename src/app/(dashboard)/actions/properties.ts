"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole, assertCanAccessProperty } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { toMinor } from "@/lib/money";
import { propertySchema, unitSchema } from "@/lib/validations/property";

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
  const unit = await prisma.unit.findUnique({ where: { id: unitId }, select: { propertyId: true } });
  if (!unit) return { success: false, error: "Unit not found." };

  const user = await requireRole(["OWNER", "ADMIN"]);
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
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { propertyId: true, name: true, _count: { select: { leases: true, maintenanceRequests: true } } },
  });
  if (!unit) return { success: false, error: "Unit not found." };

  const user = await requireRole(["OWNER", "ADMIN"]);
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

export async function getPhotoUploadUrl(propertyId: string, fileName: string, target: "property" | "unit", targetId?: string) {
  const user = await requireRole(["OWNER", "ADMIN", "CARETAKER"]);
  await assertCanAccessProperty(user, propertyId);

  const { createSignedUploadUrl } = await import("@/lib/storage");
  const { v4: uuidv4 } = await import("uuid");

  const ext = fileName.endsWith(".png") ? "png" : "webp";
  const subfolder = target === "unit" && targetId ? `units/${targetId}` : "cover";
  const filePath = `properties/${propertyId}/${subfolder}/${uuidv4()}.${ext}`;

  const signed = await createSignedUploadUrl(filePath);
  return { success: true, ...signed };
}

export async function confirmPhotoUpload(
  propertyId: string,
  filePath: string,
  target: "property" | "unit",
  targetId?: string
) {
  const user = await requireRole(["OWNER", "ADMIN", "CARETAKER"]);
  await assertCanAccessProperty(user, propertyId);

  const expectedPrefix = `properties/${propertyId}/`;
  if (!filePath.startsWith(expectedPrefix)) {
    return { success: false, error: "Invalid file path." };
  }

  const { getPublicStorageUrl } = await import("@/lib/storage");
  const publicUrl = getPublicStorageUrl(filePath);

  if (target === "unit" && targetId) {
    const unit = await prisma.unit.findUnique({ where: { id: targetId }, select: { images: true } });
    if (!unit) return { success: false, error: "Unit not found." };
    if (unit.images.length >= 5) return { success: false, error: "Maximum 5 photos per unit." };

    await prisma.unit.update({
      where: { id: targetId },
      data: { images: { push: publicUrl } },
    });
  } else {
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { images: true } });
    if (!property) return { success: false, error: "Property not found." };
    if (property.images.length >= 10) return { success: false, error: "Maximum 10 photos per property." };

    await prisma.property.update({
      where: { id: propertyId },
      data: { images: { push: publicUrl } },
    });
  }

  await logActivity({
    actorId: user.id,
    action: "PHOTO_UPLOADED",
    entityType: target === "unit" ? "Unit" : "Property",
    entityId: targetId || propertyId,
    metadata: { filePath },
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
  await assertCanAccessProperty(user, propertyId);

  if (target === "unit" && targetId) {
    const unit = await prisma.unit.findUnique({ where: { id: targetId }, select: { images: true } });
    if (!unit) return { success: false, error: "Unit not found." };
    await prisma.unit.update({
      where: { id: targetId },
      data: { images: unit.images.filter((img) => img !== photoUrl) },
    });
  } else {
    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { images: true } });
    if (!property) return { success: false, error: "Property not found." };
    await prisma.property.update({
      where: { id: propertyId },
      data: { images: property.images.filter((img) => img !== photoUrl) },
    });
  }

  try {
    const { deleteStorageObject } = await import("@/lib/storage");
    await deleteStorageObject(photoUrl);
  } catch {
    console.warn("Could not delete storage object:", photoUrl);
  }

  await logActivity({
    actorId: user.id,
    action: "PHOTO_DELETED",
    entityType: target === "unit" ? "Unit" : "Property",
    entityId: targetId || propertyId,
    metadata: { photoUrl },
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
  await assertCanAccessProperty(user, propertyId);

  if (target === "unit" && targetId) {
    await prisma.unit.update({ where: { id: targetId }, data: { images: newOrder } });
  } else {
    await prisma.property.update({ where: { id: propertyId }, data: { images: newOrder } });
  }

  revalidatePath(`/owner/properties/${propertyId}`);
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath(`/caretaker/properties/${propertyId}`);
  return { success: true };
}

