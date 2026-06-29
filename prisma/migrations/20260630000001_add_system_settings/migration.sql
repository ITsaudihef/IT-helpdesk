CREATE TABLE IF NOT EXISTS "system_settings" (
  "key"   TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL
);

INSERT OR IGNORE INTO "system_settings" ("key", "value") VALUES ('rooms_enabled', 'true');
