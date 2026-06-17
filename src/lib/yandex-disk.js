const API_BASE = "https://cloud-api.yandex.net/v1/disk";

export function getYandexDiskToken() {
  const token = process.env.YANDEX_DISK_TOKEN;

  if (!token) {
    throw new Error("Не задан YANDEX_DISK_TOKEN.");
  }

  return token;
}

export function getReviewsDiskPath() {
  return process.env.YANDEX_DISK_REVIEWS_PATH || "/portfolio/reviews.json";
}

async function diskRequest(url, token, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `OAuth ${token}`,
      ...options.headers,
    },
  });
}

export async function readDiskText(diskPath) {
  const token = getYandexDiskToken();
  const metaResponse = await diskRequest(
    `${API_BASE}/resources/download?path=${encodeURIComponent(diskPath)}`,
    token,
  );

  if (metaResponse.status === 404) {
    return null;
  }

  if (!metaResponse.ok) {
    const message = await metaResponse.text();
    throw new Error(`Yandex Disk API error ${metaResponse.status}: ${message}`);
  }

  const { href } = await metaResponse.json();
  const fileResponse = await fetch(href);

  if (!fileResponse.ok) {
    throw new Error(`Не удалось скачать файл ${diskPath}: HTTP ${fileResponse.status}`);
  }

  return fileResponse.text();
}

export async function writeDiskText(diskPath, content) {
  const token = getYandexDiskToken();
  const uploadMetaResponse = await diskRequest(
    `${API_BASE}/resources/upload?path=${encodeURIComponent(diskPath)}&overwrite=true`,
    token,
  );

  if (!uploadMetaResponse.ok) {
    const message = await uploadMetaResponse.text();
    throw new Error(`Yandex Disk API error ${uploadMetaResponse.status}: ${message}`);
  }

  const { href, method } = await uploadMetaResponse.json();
  const uploadResponse = await fetch(href, {
    method: method || "PUT",
    body: content,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text();
    throw new Error(`Не удалось загрузить файл ${diskPath}: ${message}`);
  }
}

export async function readDiskJson(diskPath) {
  const text = await readDiskText(diskPath);

  if (text === null) {
    return null;
  }

  return JSON.parse(text);
}

export async function writeDiskJson(diskPath, data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await writeDiskText(diskPath, content);
}
