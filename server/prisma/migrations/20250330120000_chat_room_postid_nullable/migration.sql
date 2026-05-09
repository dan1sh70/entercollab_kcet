-- SQLite: allow direct-message rooms without a project post (nullable post_id).
-- Apply with: npx prisma migrate deploy   OR   sqlite3 your.db < this file (then prisma migrate resolve)
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_chat_rooms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "post_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "chat_rooms_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_chat_rooms" ("id", "name", "post_id", "created_at", "updated_at")
SELECT "id", "name", "post_id", "created_at", "updated_at" FROM "chat_rooms";

DROP TABLE "chat_rooms";
ALTER TABLE "new_chat_rooms" RENAME TO "chat_rooms";

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
