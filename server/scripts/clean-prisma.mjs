import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');
const gen = path.join(serverRoot, 'src', 'generated');
const roots = [
  path.join(serverRoot, 'node_modules', '.prisma'),
  path.join(serverRoot, '..', 'node_modules', '.prisma'),
  path.join(gen, 'prisma'),
  path.join(gen, 'prisma_tmp'),
];

for (const r of roots) {
  try {
    fs.rmSync(r, { recursive: true, force: true });
    console.log('Removed', r);
  } catch (e) {
    console.warn('Could not remove', r, '-', /** @type {Error} */ (e).message);
  }
}
