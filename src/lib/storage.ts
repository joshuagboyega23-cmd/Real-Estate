import { createClient } from "@supabase/supabase-js";

export const BUCKET_NAME = "property-images";

/**
 * Returns a server-side Supabase client initialized with the secret service key.
 * Throws a clean runtime error if storage credentials are not provided.
 */
export function getStorageServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Storage is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Creates a signed upload URL for a specific file path within property-images bucket.
 */
export async function createSignedUploadUrl(filePath: string) {
  const supabase = getStorageServerClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    throw new Error(error?.message || "Failed to create signed upload URL");
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: data.path,
  };
}

/**
 * Computes public URL for an uploaded file path in the property-images bucket.
 */
export function getPublicStorageUrl(filePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Storage is not configured. Missing NEXT_PUBLIC_SUPABASE_URL.");
  }
  const cleanBase = supabaseUrl.replace(/\/+$/, "");
  const cleanPath = filePath.replace(/^\/+/, "");
  return `${cleanBase}/storage/v1/object/public/${BUCKET_NAME}/${cleanPath}`;
}

export function getStoragePathFromPublicUrl(publicUrl: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Storage is not configured. Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  const base = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${BUCKET_NAME}/`;
  if (!publicUrl.startsWith(base)) return null;

  const path = publicUrl.slice(base.length);
  if (!path || path.startsWith("/") || path.split("/").includes("..")) return null;
  return path;
}

export async function getStorageObjectMetadata(filePath: string) {
  const supabase = getStorageServerClient();
  const separator = filePath.lastIndexOf("/");
  const directory = filePath.slice(0, separator);
  const fileName = filePath.slice(separator + 1);
  if (separator <= 0 || !fileName) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(directory, { search: fileName, limit: 10 });
  if (error) {
    throw new Error("Unable to verify uploaded photo.");
  }

  const file = data.find((entry) => entry.name === fileName);
  if (!file?.metadata) return null;
  return { size: file.metadata.size, contentType: file.metadata.mimetype };
}

/**
 * Deletes a file from the property-images storage bucket.
 */
export async function deleteStorageObject(filePath: string) {
  const supabase = getStorageServerClient();
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  if (error) {
    console.error("Failed to delete storage file.");
  }
}
