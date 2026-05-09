import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(__dirname, '..');
const repoRoot = path.join(serverRoot, '..');
const genRoot = path.join(serverRoot, 'src', 'generated');
const liveDir = path.join(genRoot, 'prisma');
const tmpDir = path.join(genRoot, 'prisma_tmp');

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

if (process.platform === 'win32' && !process.env.SKIP_PRISMA_STOP) {
  const ps1 = path.join(__dirname, 'stop-collab-node-dev.ps1');
  const stopped = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ps1],
    { cwd: serverRoot, encoding: 'utf8', windowsHide: true, timeout: 20_000 }
  );
  if (stopped.stdout) process.stdout.write(stopped.stdout);
  if (stopped.stderr) process.stderr.write(stopped.stderr);
}

function tryRemoveDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('[prisma] removed', dir);
  } catch {
    console.warn('[prisma] skip remove (in use or missing):', dir);
  }
}

for (const dir of [
  path.join(repoRoot, 'node_modules', '.prisma'),
  path.join(serverRoot, 'node_modules', '.prisma'),
  tmpDir,
]) {
  tryRemoveDir(dir);
}

const genResult = spawnSync('npx', ['prisma', 'generate'], {
  cwd: serverRoot,
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (genResult.status !== 0) {
  console.error(`
────────────────────────────────────────────────────────────────
prisma generate failed (see errors above).
────────────────────────────────────────────────────────────────
`);
  process.exit(genResult.status ?? 1);
}

if (!fs.existsSync(tmpDir)) {
  console.error('[prisma] expected output missing:', tmpDir);
  process.exit(1);
}

/** Second stop: dev may have restarted during generate; release DLL on server/src/generated/prisma */
if (process.platform === 'win32' && !process.env.SKIP_PRISMA_STOP) {
  const ps1 = path.join(__dirname, 'stop-collab-node-dev.ps1');
  spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ps1],
    { cwd: serverRoot, encoding: 'utf8', windowsHide: true, timeout: 20_000 }
  );
  sleepMs(500);
}

/** Move fresh client from prisma_tmp → prisma (app imports ../generated/prisma/...). */
let promoted = false;
for (let attempt = 0; attempt < 25; attempt++) {
  try {
    if (fs.existsSync(liveDir)) {
      try {
        fs.rmSync(liveDir, { recursive: true, force: true });
      } catch {
        if (process.platform === 'win32') {
          spawnSync('cmd.exe', ['/c', `rd /s /q "${liveDir}"`], {
            stdio: 'ignore',
            shell: false,
            windowsHide: true,
          });
        }
      }
    }
    if (fs.existsSync(liveDir)) {
      throw new Error('liveDir still exists');
    }
    fs.renameSync(tmpDir, liveDir);
    promoted = true;
    console.log('[prisma] promoted prisma_tmp → prisma');
    break;
  } catch (e) {
    if (attempt === 24) {
      const marker = path.join(genRoot, '.use_prisma_tmp');
      try {
        fs.writeFileSync(marker, new Date().toISOString(), 'utf8');
      } catch {
        /* ignore */
      }
      console.warn(
        '[prisma] could not replace server/src/generated/prisma (DLL still in use). Using prisma_tmp until the next successful promote.'
      );
      console.warn('Stop npm run dev, then run: npm run db:generate');
      process.exit(0);
    }
    sleepMs(250);
  }
}

if (promoted) {
  try {
    fs.unlinkSync(path.join(genRoot, '.use_prisma_tmp'));
  } catch {
    /* ignore */
  }
}
