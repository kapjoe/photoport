import process from "node:process";
import { loadEnvLocal } from "./load-env-local.mjs";

const API_BASE = "https://cloud-api.yandex.net/v1/disk";

await loadEnvLocal();

const token = process.env.YANDEX_DISK_TOKEN;

if (!token) {
  console.error("Не задан YANDEX_DISK_TOKEN в .env.local");
  process.exit(1);
}

const headers = {
  Authorization: `OAuth ${token}`,
};

async function listPath(diskPath) {
  const response = await fetch(
    `${API_BASE}/resources?path=${encodeURIComponent(diskPath)}&limit=100`,
    { headers },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${diskPath}: ${response.status} ${message}`);
  }

  const data = await response.json();
  const items = data?._embedded?.items || [];

  console.log(`\n${diskPath}`);
  for (const item of items) {
    console.log(`  ${item.type.padEnd(4)} ${item.name}`);
  }
}

try {
  await listPath("/");
  await listPath("/portfolio");

  for (const categoryPath of [
    process.env.YANDEX_DISK_WEDDINGS_PATH,
    process.env.YANDEX_DISK_EVENTS_PATH,
  ]) {
    if (categoryPath) {
      await listPath(categoryPath);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
