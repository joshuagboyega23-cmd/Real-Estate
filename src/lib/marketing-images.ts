import "server-only";
import fs from "node:fs";
import path from "node:path";

export type MarketingImageName = "hero" | "about" | "cta" | "auth";

export function getMarketingImage(name: MarketingImageName): string {
  const imageDirectory = path.join(process.cwd(), "public", "images");

  for (const extension of ["webp", "jpg", "svg"] as const) {
    if (fs.existsSync(path.join(imageDirectory, `${name}.${extension}`))) {
      return `/images/${name}.${extension}`;
    }
  }

  throw new Error(
    `Missing marketing image "${name}". Add ${name}.webp, ${name}.jpg, or ${name}.svg to public/images.`,
  );
}
