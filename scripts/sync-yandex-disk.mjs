import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import exifr from "exifr";
import { imageSize } from "image-size";
import { loadEnvLocal } from "./load-env-local.mjs";

await loadEnvLocal();

const API_BASE = "https://cloud-api.yandex.net/v1/disk";
const token = process.env.YANDEX_DISK_TOKEN;
const outputDir = path.join(process.cwd(), "public", "cache", "photos");
const manifestPath = path.join(outputDir, "manifest.json");

const categories = [
  {
    id: "weddings",
    title: "Свадебные фотосессии",
    diskPath: process.env.YANDEX_DISK_WEDDINGS_PATH || process.env.YANDEX_DISK_PATH,
  },
  {
    id: "events",
    title: "Ивент фотосессии",
    diskPath: process.env.YANDEX_DISK_EVENTS_PATH,
  },
];

if (!token) {
  console.error("Не задан YANDEX_DISK_TOKEN. Создайте токен Яндекс.Диска и передайте его через переменную окружения.");
  process.exit(1);
}

const enabledCategories = categories.filter((category) => category.diskPath);

if (enabledCategories.length === 0) {
  console.error(
    "Не заданы папки Яндекс.Диска. Укажите YANDEX_DISK_WEDDINGS_PATH и YANDEX_DISK_EVENTS_PATH.",
  );
  process.exit(1);
}

const headers = {
  Authorization: `OAuth ${token}`,
};

const FETCH_RETRIES = 4;
const FETCH_RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, label = url) {
  let lastError;

  for (let attempt = 1; attempt <= FETCH_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, options);

      if (response.ok || response.status < 500) {
        return response;
      }

      lastError = new Error(`${label}: HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < FETCH_RETRIES) {
      const delay = FETCH_RETRY_DELAY_MS * attempt;
      console.warn(`Повтор ${attempt}/${FETCH_RETRIES - 1} для ${label} через ${delay} мс...`);
      await sleep(delay);
    }
  }

  const cause = lastError?.cause?.code || lastError?.cause?.message || "";
  const details = cause ? ` (${cause})` : "";
  throw new Error(`Сетевой сбой при запросе ${label}${details}: ${lastError?.message || "fetch failed"}`);
}

function safeFileName(name) {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function getOrientation(dimensions) {
  if (!dimensions?.width || !dimensions?.height) {
    return "unknown";
  }

  if (dimensions.height > dimensions.width) {
    return "vertical";
  }

  if (dimensions.width > dimensions.height) {
    return "horizontal";
  }

  return "square";
}

async function getDisplayDimensions(buffer) {
  const dimensions = imageSize(buffer);
  const exifOrientation = await exifr.orientation(buffer).catch(() => null);
  const shouldSwapDimensions = [5, 6, 7, 8].includes(Number(exifOrientation));

  if (shouldSwapDimensions) {
    return {
      width: dimensions.height || null,
      height: dimensions.width || null,
    };
  }

  return {
    width: dimensions.width || null,
    height: dimensions.height || null,
  };
}

async function requestJson(url, label = "Yandex Disk API") {
  const response = await fetchWithRetry(url, { headers }, label);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Yandex Disk API error ${response.status}: ${message}`);
  }

  return response.json();
}

async function getResourceItems(diskPath) {
  const resources = await requestJson(
    `${API_BASE}/resources?path=${encodeURIComponent(diskPath)}&limit=1000&preview_size=XL`,
  );

  return resources?._embedded?.items || [];
}

async function downloadFile(file, categoryId, albumSlug) {
  const extension = path.extname(file.name) || ".jpg";
  const baseName = safeFileName(path.basename(file.name, extension));
  const fileName = `${baseName}-${file.md5 || file.size}${extension.toLowerCase()}`;
  const albumOutputDir = path.join(outputDir, categoryId, albumSlug);
  const localPath = path.join(albumOutputDir, fileName);
  const publicPath = `/cache/photos/${categoryId}/${albumSlug}/${fileName}`;

  await fs.mkdir(albumOutputDir, { recursive: true });

  try {
    const current = await fs.stat(localPath);
    if (current.size === file.size) {
      const buffer = await fs.readFile(localPath);
      const dimensions = await getDisplayDimensions(buffer);

      return {
        ...file,
        publicPath,
        width: dimensions.width || null,
        height: dimensions.height || null,
        orientation: getOrientation(dimensions),
      };
    }
  } catch {
    // Файла еще нет в кеше, скачиваем ниже.
  }

  const downloadInfo = await requestJson(
    `${API_BASE}/resources/download?path=${encodeURIComponent(file.path)}`,
    `ссылка на ${file.name}`,
  );
  const response = await fetchWithRetry(downloadInfo.href, {}, `скачивание ${file.name}`);

  if (!response.ok) {
    throw new Error(`Не удалось скачать ${file.name}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(localPath, buffer);
  const dimensions = await getDisplayDimensions(buffer);

  return {
    ...file,
    publicPath,
    width: dimensions.width || null,
    height: dimensions.height || null,
    orientation: getOrientation(dimensions),
  };
}

async function syncAlbum(category, album) {
  const albumSlug = safeFileName(album.name);
  const albumItems = await getResourceItems(album.path);
  const images = albumItems.filter((item) => item.type === "file" && item.mime_type?.startsWith("image/"));
  const photos = [];

  for (const image of images) {
    try {
      const cached = await downloadFile(image, category.id, albumSlug);
      photos.push({
        id: `${category.id}-${albumSlug}-${cached.md5 || cached.path}`,
        name: cached.name,
        publicPath: cached.publicPath,
        size: cached.size,
        mimeType: cached.mime_type,
        modified: cached.modified,
        width: cached.width,
        height: cached.height,
        orientation: cached.orientation,
      });
      console.log(`Синхронизировано: ${category.title} / ${album.name} / ${cached.name}`);
    } catch (error) {
      console.error(`Пропущено: ${category.title} / ${album.name} / ${image.name} — ${error.message}`);
    }
  }

  return {
    id: `${category.id}-${albumSlug}`,
    title: album.name,
    diskPath: album.path,
    cover: photos[0] || null,
    photos,
  };
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    categories: {},
    photos: [],
  };

  for (const category of enabledCategories) {
    const categoryItems = await getResourceItems(category.diskPath);
    const albums = categoryItems.filter((item) => item.type === "dir");
    const syncedAlbums = [];

    for (const album of albums) {
      syncedAlbums.push(await syncAlbum(category, album));
    }

    manifest.categories[category.id] = {
      id: category.id,
      title: category.title,
      diskPath: category.diskPath,
      albums: syncedAlbums,
    };
    manifest.photos.push(...syncedAlbums.flatMap((album) => album.photos));
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Готово. Фото в кеше: ${manifest.photos.length}`);
}

main().catch((error) => {
  console.error(error.message);
  if (error.cause) {
    console.error(error.cause);
  }
  process.exit(1);
});
