import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), "data", "reviews.sqlite");

let db;

function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        event_date TEXT NOT NULL,
        event_type TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }

  return db;
}

export function getReviews() {
  return getDb()
    .prepare(`
      SELECT
        id,
        name,
        event_date AS eventDate,
        event_type AS eventType,
        text,
        created_at AS createdAt
      FROM reviews
      ORDER BY created_at DESC, id DESC
    `)
    .all();
}

export function addReview({ name, eventDate, eventType, text }) {
  const result = getDb()
    .prepare(`
      INSERT INTO reviews (name, event_date, event_type, text)
      VALUES (@name, @eventDate, @eventType, @text)
    `)
    .run({ name, eventDate, eventType, text });

  return getDb()
    .prepare(`
      SELECT
        id,
        name,
        event_date AS eventDate,
        event_type AS eventType,
        text,
        created_at AS createdAt
      FROM reviews
      WHERE id = ?
    `)
    .get(result.lastInsertRowid);
}

export function deleteReview(id) {
  const result = getDb()
    .prepare("DELETE FROM reviews WHERE id = ?")
    .run(id);

  return result.changes > 0;
}
