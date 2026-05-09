import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generated = path.join(__dirname, 'generated');
const marker = path.join(generated, '.use_prisma_tmp');
const liveClient = path.join(generated, 'prisma', 'client.js');
const tmpClient = path.join(generated, 'prisma_tmp', 'client.js');
function resolveClientPath() {
    if (fs.existsSync(marker) && fs.existsSync(tmpClient)) {
        return tmpClient;
    }
    if (fs.existsSync(liveClient)) {
        return liveClient;
    }
    if (fs.existsSync(tmpClient)) {
        return tmpClient;
    }
    throw new Error('Missing Prisma client. Run: npm run db:generate (from collab-node root).');
}
const { PrismaClient } = require(resolveClientPath());
export const prisma = new PrismaClient();
//# sourceMappingURL=prismaClient.js.map