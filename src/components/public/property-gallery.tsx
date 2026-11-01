"use client";

import * as React from "react";
import Image from "next/image";
import { Building2, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface PropertyGalleryProps {
  images: string[];
  propertyName: string;
}

export function PropertyGallery({ images, propertyName }: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [previousIndex, setPreviousIndex] = React.useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const thumbnailRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const touchStart = React.useRef<{ x: number; y: number } | null>(null);
  const transitionTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectImage = (index: number) => {
    if (index === selectedIndex) return;
    setPreviousIndex(selectedIndex);
    setSelectedIndex(index);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => setPreviousIndex(null), 300);
  };
  const showPrev = () => selectImage(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
  const showNext = () => selectImage((selectedIndex + 1) % images.length);

  React.useEffect(() => {
    thumbnailRefs.current[selectedIndex]?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [selectedIndex]);

  React.useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") touchStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) showPrev();
      else showNext();
    }
  };

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-[16/9] w-full items-center justify-center rounded-2xl border bg-sky">
        <Building2 className="size-16 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-[16/9] w-full overflow-hidden rounded-2xl border bg-sky shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        tabIndex={0}
        role="region"
        aria-label={`${propertyName} photo gallery`}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <Image
          key={selectedIndex}
          src={images[selectedIndex]}
          alt={`${propertyName} photo ${selectedIndex + 1}`}
          fill
          priority={selectedIndex === 0}
          className="gallery-image-fade object-cover"
          sizes="(max-width: 1024px) 100vw, 1200px"
        />
        {previousIndex !== null && (
          <Image
            key={`previous-${previousIndex}`}
            src={images[previousIndex]}
            alt=""
            fill
            aria-hidden="true"
            className="gallery-image-previous pointer-events-none object-cover"
            sizes="(max-width: 1024px) 100vw, 1200px"
          />
        )}

        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 size-10 -translate-y-1/2 rounded-full bg-white/95 shadow-md backdrop-blur transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
              onClick={showPrev}
              aria-label="Show previous photo"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 size-10 -translate-y-1/2 rounded-full bg-white/95 shadow-md backdrop-blur transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
              onClick={showNext}
              aria-label="Show next photo"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </Button>

            <div className="absolute bottom-3 right-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-navy shadow-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          </>
        )}
        <Button
          type="button"
          variant="secondary"
          className="absolute bottom-3 left-3 rounded-lg bg-white/95 shadow-md"
          onClick={() => setLightboxOpen(true)}
        >
          <Images className="size-4" aria-hidden="true" />
          View all {images.length} photos
        </Button>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin" aria-label="Photo thumbnails">
          {images.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              ref={(element) => { thumbnailRefs.current[idx] = element; }}
              type="button"
              onClick={() => selectImage(idx)}
              aria-label={`Show photo ${idx + 1} of ${images.length}`}
              aria-pressed={idx === selectedIndex}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-20 ${
                idx === selectedIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-transparent opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                src={url}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton
          className="max-w-6xl border-0 bg-navy p-3 text-white sm:max-w-6xl sm:p-5"
          aria-describedby="property-gallery-description"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              showPrev();
            } else if (event.key === "ArrowRight") {
              event.preventDefault();
              showNext();
            }
          }}
        >
          <DialogTitle className="sr-only">{propertyName} photo gallery</DialogTitle>
          <DialogDescription id="property-gallery-description" className="sr-only">
            Photo {selectedIndex + 1} of {images.length}
          </DialogDescription>
          <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden rounded-xl bg-black">
            <Image
              key={`lightbox-${selectedIndex}`}
              src={images[selectedIndex]}
              alt={`${propertyName} photo ${selectedIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 1100px"
              className="gallery-image-fade object-contain"
            />
            {previousIndex !== null && (
              <Image
                key={`lightbox-previous-${previousIndex}`}
                src={images[previousIndex]}
                alt=""
                fill
                aria-hidden="true"
                sizes="(max-width: 768px) 100vw, 1100px"
                className="gallery-image-previous pointer-events-none object-contain"
              />
            )}
            {images.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute left-3 top-1/2 size-10 -translate-y-1/2 rounded-full"
                  onClick={showPrev}
                  aria-label="Show previous photo"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-1/2 size-10 -translate-y-1/2 rounded-full"
                  onClick={showNext}
                  aria-label="Show next photo"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              </>
            )}
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-sm text-white">
              {selectedIndex + 1} / {images.length}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
