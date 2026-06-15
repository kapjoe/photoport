import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { normalizeManifest, pickFeaturedPhotos } from "@/lib/photoManifest";

export const runtime = "nodejs";

const manifestPath = path.join(process.cwd(), "public", "cache", "photos", "manifest.json");

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category");
    const manifest = await fs.readFile(manifestPath, "utf8");
    const normalizedManifest = normalizeManifest(JSON.parse(manifest));

    if (categoryId) {
      const category = normalizedManifest.categories[categoryId];

      return NextResponse.json({
        category: category || null,
        albums: category?.albums || [],
        photos: category?.albums?.flatMap((album) => album.photos || []) || [],
      });
    }

    return NextResponse.json({
      photos: normalizedManifest.photos,
      featured: pickFeaturedPhotos(normalizedManifest, 12),
    });
  } catch {
    return NextResponse.json({ category: null, albums: [], photos: [], featured: [] });
  }
}
