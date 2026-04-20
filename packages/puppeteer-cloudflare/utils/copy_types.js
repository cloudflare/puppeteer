import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const generatedDir = path.join(packageDir, '.types');
const outputDir = path.join(packageDir, 'lib');
const puppeteerTypesDir = path.resolve(
  packageDir,
  '../../submodules/puppeteer/packages/puppeteer-core/lib/puppeteer'
);
const thirdPartyTypesDir = path.resolve(
  packageDir,
  '../../submodules/puppeteer/packages/puppeteer-core/lib/third_party'
);

function copyDeclarations(sourceDir, destinationDir, rewriteThirdParty = false) {
  for (const entry of fs.readdirSync(sourceDir, {withFileTypes: true})) {
    const source = path.join(sourceDir, entry.name);
    const destination = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      copyDeclarations(source, destination, rewriteThirdParty);
    } else if (entry.name.endsWith('.d.ts')) {
      fs.mkdirSync(destinationDir, {recursive: true});
      let contents = fs.readFileSync(source, 'utf8');
      if (rewriteThirdParty) {
        contents = contents.replace(
          /((?:\.\.\/)+)third_party\//g,
          (_, prefix) => `${prefix.slice(3)}third_party/`
        );
      }
      fs.writeFileSync(destination, contents);
    }
  }
}

function copyCloudflareDeclarations(sourceDir, destinationDir, depth = 0) {
  for (const entry of fs.readdirSync(sourceDir, {withFileTypes: true})) {
    const source = path.join(sourceDir, entry.name);
    const destination = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      copyCloudflareDeclarations(source, destination, depth + 1);
    } else if (entry.name.endsWith('.d.ts')) {
      fs.mkdirSync(destinationDir, {recursive: true});
      const puppeteerPrefix = `${'../'.repeat(depth + 1)}puppeteer-core/`;
      let contents = fs.readFileSync(source, 'utf8').replaceAll(
        'puppeteer-core/lib/',
        puppeteerPrefix
      );
      fs.writeFileSync(destination, contents);
    }
  }
}

copyDeclarations(
  puppeteerTypesDir,
  path.join(outputDir, 'puppeteer-core'),
  true
);
copyDeclarations(
  thirdPartyTypesDir,
  path.join(outputDir, 'puppeteer-core/third_party')
);
let indexDeclaration = fs.readFileSync(
  path.join(generatedDir, 'index.d.ts'),
  'utf8'
);
indexDeclaration = indexDeclaration
  .replaceAll('puppeteer-core/lib/', './puppeteer-core/')
  .replaceAll('./cloudflare/', './puppeteer-cloudflare/cloudflare/');
fs.writeFileSync(path.join(outputDir, 'index.d.ts'), indexDeclaration);
copyCloudflareDeclarations(
  path.join(generatedDir, 'cloudflare'),
  path.join(outputDir, 'puppeteer-cloudflare/cloudflare'),
  1
);
fs.rmSync(generatedDir, {recursive: true});
