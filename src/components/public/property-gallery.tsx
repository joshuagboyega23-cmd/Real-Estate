"use client";

import * as React from "react";
import Image from "next/image";
import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyGalleryProps {
  images: string[];
  propertyName: string;
}

export function PropertyGallery({ images, propertyName }: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  if (images.length === 0) {
    return (
      <div className="relative aspect-16/9 w-full rounded-2xl bg-muted flex items-center justify-center border">
        <Building2 className="size-16 text-muted-foreground/30" />
      </div>
    );
  }

  const prevImage = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-16/9 w-full rounded-2xl bg-muted overflow-hidden border group">
        <Image
          src={images[selectedIndex]}
          alt={`${propertyName} photo ${selectedIndex + 1}`}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 1200px"
        />

        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-background/80 backdrop-blur shadow opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevImage}
            >
              <ChevronLeft className="size-5" />
              <span className="sr-only">Previous photo</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-background/80 backdrop-blur shadow opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <ChevronRight className="size-5" />
              <span className="sr-only">Next photo</span>
            </Button>

            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur px-2.5 py-1 rounded-md text-xs font-medium shadow-xs">
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((url, idx) => (
            <button
              key={url}
              onClick={() => setSelectedIndex(idx)}
              className={`relative size-16 sm:size-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                idx === selectedIndex
                  ? "border-primary ring-2 ring-primary/20 scale-95"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={url}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

