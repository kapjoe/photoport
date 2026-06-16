import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE = "https://cloud-api.yandex.net/v1/disk";

function getAllowedPrefixes() {
  return [
    process.env.YANDEX_DISK_WEDDINGS_PATH,
    process.env.YANDEX_DISK_EVENTS_PATH,
    process.env.YANDEX_DISK_PATH,
  ].filter(Boolean);
}

function isAllowedDiskPath(diskPath) {
  return getAllowedPrefixes().some(
    (prefix) => diskPath === prefix || diskPath.startsWith(`${prefix}/`),
  );
}

function decodeDiskPath(encoded) {
  try {
    return Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

export async function GET(_request, { params }) {
  const token = process.env.YANDEX_DISK_TOKEN;
  const diskPath = decodeDiskPath(params.encoded);

  if (!token || !diskPath || !isAllowedDiskPath(diskPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const downloadResponse = await fetch(
      `${API_BASE}/resources/download?path=${encodeURIComponent(diskPath)}`,
      {
        headers: { Authorization: `OAuth ${token}` },
      },
    );

    if (!downloadResponse.ok) {
      return NextResponse.json({ error: "Download link failed" }, { status: 502 });
    }

    const { href } = await downloadResponse.json();
    const imageResponse = await fetch(href);

    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
    }

    const responseHeaders = new Headers();
    const contentType = imageResponse.headers.get("content-type");

    if (contentType) {
      responseHeaders.set("Content-Type", contentType);
    }

    responseHeaders.set("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");

    return new Response(imageResponse.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ error: "Proxy failed" }, { status: 502 });
  }
}
