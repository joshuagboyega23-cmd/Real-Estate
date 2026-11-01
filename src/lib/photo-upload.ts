export const PHOTO_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type PhotoContentType = (typeof PHOTO_CONTENT_TYPES)[number];

export const MAX_PHOTO_UPLOAD_BYTES = 5 * 1024 * 1024;
export const PHOTO_LIMITS = {
  property: 10,
  unit: 5,
} as const;

export function isPhotoContentType(value: string): value is PhotoContentType {
  return PHOTO_CONTENT_TYPES.some((contentType) => contentType === value);
}

export function photoExtension(contentType: PhotoContentType): "jpg" | "png" | "webp" {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  return "webp";
}
