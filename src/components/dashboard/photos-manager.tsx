"use client";

import * as React from "react";
import Image from "next/image";
import {
  getPhotoUploadUrl,
  confirmPhotoUpload,
  deletePhoto,
  reorderPhotos,
} from "@/app/(dashboard)/actions/properties";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  Trash2,
  Star,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface PhotosManagerProps {
  propertyId: string;
  target?: "property" | "unit";
  targetId?: string;
  initialPhotos: string[];
  maxPhotos?: number;
}

/**
 * Compresses an image in the browser to <= 1600px on the long side as WebP under ~800KB.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      const maxDimension = 1600;
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export as webp with quality 0.85
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        "image/webp",
        0.85
      );
    };

    reader.readAsDataURL(file);
  });
}

export function PhotosManager({
  propertyId,
  target = "property",
  targetId,
  initialPhotos,
  maxPhotos = 10,
}: PhotosManagerProps) {
  const [photos, setPhotos] = React.useState<string[]>(initialPhotos);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync state if initialPhotos changes
  React.useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (photos.length + files.length > maxPhotos) {
      setErrorMessage(`Maximum of ${maxPhotos} photos allowed. You currently have ${photos.length}.`);
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          setErrorMessage("Only JPEG, PNG, and WebP images are allowed.");
          continue;
        }

        setUploadProgress(`Compressing photo ${i + 1} of ${files.length}...`);
        const compressedBlob = await compressImage(file);

        setUploadProgress(`Requesting upload URL for photo ${i + 1}...`);
        const urlRes = await getPhotoUploadUrl(
          propertyId,
          file.name.replace(/\.[^/.]+$/, ".webp"),
          target,
          targetId
        );

        if (!urlRes.success || !urlRes.signedUrl || !urlRes.token || !urlRes.path) {
          throw new Error("Failed to acquire signed upload URL from server.");
        }

        setUploadProgress(`Uploading photo ${i + 1} of ${files.length}...`);

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { error: uploadError } = await supabase.storage
            .from("property-images")
            .uploadToSignedUrl(urlRes.path, urlRes.token, compressedBlob);

          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }
        } else {
          // Direct signed URL PUT fallback if client SDK env vars are absent
          const uploadRes = await fetch(urlRes.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": "image/webp" },
            body: compressedBlob,
          });

          if (!uploadRes.ok) {
            throw new Error(`Upload failed with status ${uploadRes.status}`);
          }
        }

        setUploadProgress(`Registering photo ${i + 1}...`);
        const confirmRes = await confirmPhotoUpload(
          propertyId,
          urlRes.path,
          target,
          targetId
        );

        if (!confirmRes.success || !confirmRes.url) {
          throw new Error(confirmRes.error || "Failed to confirm photo upload.");
        }

        setPhotos((prev) => [...prev, confirmRes.url!]);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSetCover = async (index: number) => {
    if (index === 0) return;
    const photoToMove = photos[index];
    const newOrder = [photoToMove, ...photos.filter((_, i) => i !== index)];
    setPhotos(newOrder);

    try {
      await reorderPhotos(propertyId, newOrder, target, targetId);
    } catch {
      setPhotos(photos); // rollback
    }
  };

  const handleDelete = async (photoUrl: string) => {
    const updated = photos.filter((p) => p !== photoUrl);
    setPhotos(updated);

    try {
      const res = await deletePhoto(propertyId, photoUrl, target, targetId);
      if (!res.success) {
        setPhotos(photos); // rollback
        setErrorMessage("Failed to delete photo.");
      }
    } catch {
      setPhotos(photos);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Photo Gallery</h3>
          <p className="text-sm text-muted-foreground">
            {photos.length} of {maxPhotos} photos uploaded. The first photo serves as the cover image.
          </p>
        </div>

        {photos.length < maxPhotos && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={isUploading}
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="size-4 mr-2" />
                  Upload Photos
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {uploadProgress && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-muted/60 text-sm font-medium">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>{uploadProgress}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium border border-destructive/20">
          {errorMessage}
        </div>
      )}

      {photos.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center py-16 text-center gap-3 rounded-lg border border-dashed bg-muted/20 hover:bg-muted/30 cursor-pointer transition-colors"
        >
          <ImageIcon className="size-10 text-muted-foreground/60" />
          <div className="text-sm">
            <p className="font-medium">No photos uploaded yet</p>
            <p className="text-muted-foreground mt-0.5">
              Click to browse or drop JPEG, PNG, or WebP images here (up to {maxPhotos} photos).
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((url, idx) => (
            <Card key={url} className="overflow-hidden group relative">
              <div className="relative aspect-4/3 w-full bg-muted">
                <Image
                  src={url}
                  alt={`Photo ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {idx === 0 && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="default" className="text-[10px] gap-1 px-1.5 py-0 shadow">
                      <Star className="size-3 fill-current" />
                      Cover
                    </Badge>
                  </div>
                )}

                {/* Overlay actions on hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  {idx !== 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleSetCover(idx)}
                    >
                      <Star className="size-3" />
                      Set Cover
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="size-8"
                    onClick={() => handleDelete(url)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete photo</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

