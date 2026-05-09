import crypto from 'crypto';
import prisma from '../config/database.js';

function makeId(prefix: string) {
  // Keep it short, readable, and still effectively unique.
  // Example: PRJ-3F8K2P9Q
  const chunk = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
  return `${prefix}-${chunk}`;
}

async function hasColumn(table: string, column: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(`PRAGMA table_info(${table});`);
  return rows.some((r) => String(r.name).toLowerCase() === column.toLowerCase());
}

async function addColumnIfMissing(table: string) {
  const column = 'public_id';
  if (await hasColumn(table, column)) return;
  await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT;`);
}

async function ensureUniqueIndex(table: string) {
  const indexName = `${table}_public_id_unique`;
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${table}(public_id);`);
}

async function ensurePostTrigger() {
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER IF NOT EXISTS posts_public_id_autogen
    AFTER INSERT ON posts
    FOR EACH ROW
    WHEN NEW.public_id IS NULL
    BEGIN
      UPDATE posts
      SET public_id =
        (CASE
          WHEN NEW.type = 'project' THEN 'PRJ'
          WHEN NEW.type = 'research' THEN 'RESPOST'
          WHEN NEW.type = 'text' THEN 'PST'
          ELSE 'POST'
        END) || '-' || UPPER(HEX(RANDOMBLOB(5)))
      WHERE id = NEW.id;
    END;
  `);
}

async function ensureResearchTrigger() {
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER IF NOT EXISTS research_papers_public_id_autogen
    AFTER INSERT ON research_papers
    FOR EACH ROW
    WHEN NEW.public_id IS NULL
    BEGIN
      UPDATE research_papers
      SET public_id = 'RES' || '-' || UPPER(HEX(RANDOMBLOB(5)))
      WHERE id = NEW.id;
    END;
  `);
}

async function backfillPosts() {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: number; type: string | null }>>(
    `SELECT id, type FROM posts WHERE public_id IS NULL;`
  );
  for (const r of rows) {
    const prefix = r.type === 'project' ? 'PRJ' : r.type === 'research' ? 'RESPOST' : r.type === 'text' ? 'PST' : 'POST';
    // retry on collision
    for (let i = 0; i < 5; i += 1) {
      try {
        await prisma.$executeRawUnsafe(`UPDATE posts SET public_id = ? WHERE id = ?;`, makeId(prefix), r.id);
        break;
      } catch {
        if (i === 4) throw new Error(`Failed to set publicId for post ${r.id}`);
      }
    }
  }
}

async function backfillResearch() {
  const rows = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
    `SELECT id FROM research_papers WHERE public_id IS NULL;`
  );
  for (const r of rows) {
    for (let i = 0; i < 5; i += 1) {
      try {
        await prisma.$executeRawUnsafe(`UPDATE research_papers SET public_id = ? WHERE id = ?;`, makeId('RES'), r.id);
        break;
      } catch {
        if (i === 4) throw new Error(`Failed to set publicId for researchPaper ${r.id}`);
      }
    }
  }
}

async function main() {
  await addColumnIfMissing('posts');
  await addColumnIfMissing('research_papers');

  await ensurePostTrigger();
  await ensureResearchTrigger();

  await backfillPosts();
  await backfillResearch();

  await ensureUniqueIndex('posts');
  await ensureUniqueIndex('research_papers');
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

