
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const replace = process.env.BROWSER_BINDINGS;

const currDir = path.dirname(fileURLToPath(import.meta.url));
const srcWranglerPath = path.join(currDir, '../tests/wrangler.toml');
const destWranglerPath = path.join(currDir, '../tests/wrangler-test.toml');

// Read the existing wrangler.toml file
let wranglerContent = fs.readFileSync(srcWranglerPath, 'utf8');

if (replace) {
  // Replace the [browser] section with the new bindings
  const browserSectionRegex = `[browser]
binding = "BROWSER"
`;

  const originalContent = wranglerContent;
  wranglerContent = wranglerContent.replace(browserSectionRegex, replace);
  if (wranglerContent === originalContent) {
    throw new Error('Failed to replace browser bindings in wrangler.toml');
  }
}

// Write the updated content back to wrangler.toml
fs.writeFileSync(destWranglerPath, wranglerContent, 'utf8');
