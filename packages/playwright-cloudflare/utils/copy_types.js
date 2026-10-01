import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const basedir = path.dirname(fileURLToPath(import.meta.url));

const destDir = path.join(basedir, '../types');

fs.mkdirSync(destDir, { recursive: true });

const sourceDir = path.join(basedir, '../../../submodules/playwright/packages/playwright-core/types');
for (const file of fs.readdirSync(sourceDir)) {
  const sourceFile = path.join(sourceDir, file);
  const destFile = path.join(destDir, file);
  fs.copyFileSync(sourceFile, destFile);
}

const testFileContent = fs.readFileSync(path.join(basedir, '../../../submodules/playwright/packages/playwright/types/test.d.ts'), 'utf8');
const updatedContent = testFileContent.replace(/(import|export) (.*) from 'playwright-core'/g, '$1 $2 from \'./types\'');
fs.writeFileSync(path.join(destDir, 'test.d.ts'), updatedContent, 'utf8');

