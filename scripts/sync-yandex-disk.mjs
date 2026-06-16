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

function parseArgs(argv) {
  const args = { category: null, album: null, next: false, list: false, metadataOnly: false };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--next") {
      args.next = true;
      continue;
    }

    if (value === "--list") {
      args.list = true;
      continue;
    }

    if (value === "--metadata-only") {
      args.metadataOnly = true;
      continue;
    }

    if (value === "--category" && argv[index + 1]) {
      args.category = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === "--album" && argv[index + 1]) {
      args.album = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

const cli = parseArgs(process.argv);

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

function toApiPublicPath(diskPath) {
  return `/api/photos/image/${Buffer.from(diskPath, "utf8").toString("base64url")}`;
}

function findExistingPhoto(manifest, categoryId, album, file) {
  const albumEntry = getManifestAlbum(manifest, categoryId, album);
  const albumSlug = safeFileName(album.name);
  const photoId = `${categoryId}-${albumSlug}-${file.md5 || file.path}`;

  return albumEntry?.photos?.find((photo) => photo.id === photoId) || null;
}

async function processPhotoFile(file, categoryId, albumSlug, existingPhoto = null) {
  if (cli.metadataOnly) {
    const publicPath = toApiPublicPath(file.path);

    if (existingPhoto?.width && existingPhoto?.height) {
      return {
        ...file,
        publicPath,
        width: existingPhoto.width,
        height: existingPhoto.height,
        orientation: existingPhoto.orientation || getOrientation(existingPhoto),
      };
    }

    const downloadInfo = await requestJson(
      `${API_BASE}/resources/download?path=${encodeURIComponent(file.path)}`,
      `ссылка на ${file.name}`,
    );
    const response = await fetchWithRetry(downloadInfo.href, {}, `чтение ${file.name}`);

    if (!response.ok) {
      throw new Error(`Не удалось прочитать ${file.name}: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const dimensions = await getDisplayDimensions(buffer);

    return {
      ...file,
      publicPath,
      width: dimensions.width || null,
      height: dimensions.height || null,
      orientation: getOrientation(dimensions),
    };
  }

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

async function loadManifest() {
  try {
    const content = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(content);

    return {
      generatedAt: manifest.generatedAt || new Date().toISOString(),
      categories: manifest.categories || {},
      photos: Array.isArray(manifest.photos) ? manifest.photos : [],
    };
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      categories: {},
      photos: [],
    };
  }
}

function rebuildPhotosList(manifest) {
  manifest.photos = Object.values(manifest.categories).flatMap((category) =>
    (category.albums || []).flatMap((album) => album.photos || []),
  );
  manifest.generatedAt = new Date().toISOString();
}

function mergeAlbum(manifest, category, syncedAlbum) {
  if (!manifest.categories[category.id]) {
    manifest.categories[category.id] = {
      id: category.id,
      title: category.title,
      diskPath: category.diskPath,
      albums: [],
    };
  }

  const albums = manifest.categories[category.id].albums;
  const existingIndex = albums.findIndex(
    (album) => album.id === syncedAlbum.id || album.diskPath === syncedAlbum.diskPath,
  );

  if (existingIndex >= 0) {
    albums[existingIndex] = syncedAlbum;
  } else {
    albums.push(syncedAlbum);
  }

  rebuildPhotosList(manifest);
}

async function saveManifest(manifest) {
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function getManifestAlbum(manifest, categoryId, album) {
  const category = manifest.categories[categoryId];
  if (!category) {
    return null;
  }

  const albumSlug = safeFileName(album.name);

  return (
    category.albums?.find(
      (entry) => entry.diskPath === album.path || safeFileName(entry.title) === albumSlug,
    ) || null
  );
}

function isAlbumSynced(manifest, categoryId, album, imageCount) {
  const existing = getManifestAlbum(manifest, categoryId, album);

  if (!existing?.photos?.length) {
    return false;
  }

  return existing.photos.length >= imageCount;
}

async function countAlbumImages(album) {
  const albumItems = await getResourceItems(album.path);

  return albumItems.filter((item) => item.type === "file" && item.mime_type?.startsWith("image/")).length;
}

function resolveCategories() {
  if (!cli.category) {
    return enabledCategories;
  }

  const category = enabledCategories.find((entry) => entry.id === cli.category);

  if (!category) {
    throw new Error(`Неизвестная категория "${cli.category}". Доступно: ${enabledCategories.map((entry) => entry.id).join(", ")}`);
  }

  return [category];
}

async function findAlbumOnDisk(category, albumName) {
  const categoryItems = await getResourceItems(category.diskPath);
  const albums = categoryItems.filter((item) => item.type === "dir");
  const normalizedName = safeFileName(albumName);

  const album =
    albums.find((entry) => entry.name === albumName) ||
    albums.find((entry) => safeFileName(entry.name) === normalizedName) ||
    albums.find((entry) => entry.name.toLowerCase() === albumName.toLowerCase());

  if (!album) {
    throw new Error(`Альбом "${albumName}" не найден в категории ${category.id}.`);
  }

  return album;
}

async function collectAlbumsToSync(manifest) {
  if (cli.next) {
    for (const category of enabledCategories) {
      const categoryItems = await getResourceItems(category.diskPath);
      const albums = categoryItems.filter((item) => item.type === "dir");

      for (const album of albums) {
        const imageCount = await countAlbumImages(album);

        if (!isAlbumSynced(manifest, category.id, album, imageCount)) {
          return [{ category, album }];
        }
      }
    }

    return [];
  }

  const selectedCategories = resolveCategories();
  const queue = [];

  for (const category of selectedCategories) {
    const categoryItems = await getResourceItems(category.diskPath);
    const albums = categoryItems.filter((item) => item.type === "dir");

    if (cli.album) {
      queue.push({ category, album: await findAlbumOnDisk(category, cli.album) });
      continue;
    }

    for (const album of albums) {
      queue.push({ category, album });
    }
  }

  return queue;
}

async function listAlbums(manifest) {
  for (const category of enabledCategories) {
    console.log(`\n${category.title} (${category.id})`);

    const categoryItems = await getResourceItems(category.diskPath);
    const albums = categoryItems.filter((item) => item.type === "dir");

    if (albums.length === 0) {
      console.log("  (пусто)");
      continue;
    }

    for (const album of albums) {
      const imageCount = await countAlbumImages(album);
      const existing = getManifestAlbum(manifest, category.id, album);
      const synced = isAlbumSynced(manifest, category.id, album, imageCount);
      const status = synced ? "готово" : "ожидает";
      const cachedCount = existing?.photos?.length || 0;

      console.log(`  [${status}] ${album.name} (${cachedCount}/${imageCount})`);
    }
  }
}

async function syncAlbum(category, album, manifest) {
  const albumSlug = safeFileName(album.name);
  const albumItems = await getResourceItems(album.path);
  const images = albumItems.filter((item) => item.type === "file" && item.mime_type?.startsWith("image/"));
  const photos = [];

  for (const image of images) {
    try {
      const cached = await processPhotoFile(
        image,
        category.id,
        albumSlug,
        findExistingPhoto(manifest, category.id, album, image),
      );
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

  const manifest = await loadManifest();

  if (cli.list) {
    await listAlbums(manifest);
    return;
  }

  const albumsToSync = await collectAlbumsToSync(manifest);

  if (albumsToSync.length === 0) {
    console.log("Все альбомы уже синхронизированы.");
    console.log(`Фото в кеше: ${manifest.photos.length}`);
    return;
  }

  for (const { category, album } of albumsToSync) {
    console.log(`\nАльбом: ${category.title} / ${album.name}`);
    const syncedAlbum = await syncAlbum(category, album, manifest);
    mergeAlbum(manifest, category, syncedAlbum);
    await saveManifest(manifest);
    console.log(`Сохранено в manifest: ${category.title} / ${album.name} (${syncedAlbum.photos.length} фото)`);

    if (cli.next) {
      break;
    }
  }

  console.log(`\nГотово. Фото в кеше: ${manifest.photos.length}`);
}

main().catch((error) => {
  console.error(error.message);
  if (error.cause) {
    console.error(error.cause);
  }
  process.exit(1);
});
