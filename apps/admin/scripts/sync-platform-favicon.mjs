/**
 * Keep admin's app-router favicon identical to the platform default used by the
 * tour viewer. Source of truth: apps/tour-viewer/assets/favicon.ico
 * (also synced to the viewer's public/favicon.ico by sync-assets).
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const adminRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(adminRoot, '..', 'tour-viewer', 'assets', 'favicon.ico');
const dest = join(adminRoot, 'src', 'app', 'favicon.ico');

if (!existsSync(source)) {
  console.error(
    'Platform favicon missing:',
    source,
    '\nExpected apps/tour-viewer/assets/favicon.ico',
  );
  process.exit(1);
}

copyFileSync(source, dest);
console.log('Synced platform favicon.ico → apps/admin/src/app/favicon.ico');
