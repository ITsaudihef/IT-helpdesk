-- Seed initial users
INSERT OR IGNORE INTO "users" ("id", "name", "email", "passwordHash", "role", "department", "createdAt")
VALUES
  ('cmqh5aqbt000011waqbp5qkik', 'عبدالله الصقير', 'admin@helpdesk.com', '$2b$12$lcMs5nb0SOhh5yA5atJ1aeepgo2VsE3zzCbPyjR.EwvpREU5woHe2', 'ADMIN', 'تقنية المعلومات', datetime('now')),
  ('cmqlkv4w90000lw9g4lzgfowj', 'test user', 't@t.com', '$2b$10$sGf4LVmlcNkw.zUSRnBkMOQX7nzYYISyqr4qEwowK8jLjp8DefI42', 'USER', 'الخدمات المشتركة', datetime('now')),
  ('cmqlkvsiz0001lw9gr5hjeh8f', 'test h', 'th@t.com', '$2b$12$cclv3q/29Lc7Vp3R3sPpPeQ2cCcVWB5MrL6dG8N40GxspdHzMJre6', 'SUPPORT', 'الخدمات المشتركة', datetime('now'));

-- Update admin password (runs if user already exists with different hash)
UPDATE "users" SET "passwordHash" = '$2b$12$lcMs5nb0SOhh5yA5atJ1aeepgo2VsE3zzCbPyjR.EwvpREU5woHe2'
WHERE "email" = 'admin@helpdesk.com';
