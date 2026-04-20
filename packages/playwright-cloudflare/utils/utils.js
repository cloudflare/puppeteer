import fs from 'fs';
import path from 'path';

export function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, { encoding: 'utf-8' });
}

export function deleteDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

export function listFiles(dir, options) {
  const files = [];
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && options?.recursive) {
      files.push(...listFiles(fullPath));
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}
