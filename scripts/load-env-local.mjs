import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

export async function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");

  try {
    const content = await fs.readFile(envPath, "utf8");

    for (const line of content.split("\n")) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local необязателен, если переменные уже заданы в окружении.
  }
}
