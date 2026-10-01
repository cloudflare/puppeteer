import fs from 'node:fs';
import {pathToFileURL} from 'node:url';

if (isMainModule())
  await main();

async function main() {
  const packageJsonPath = process.argv[2];
  if (!packageJsonPath)
    throw new Error('Usage: node scripts/verify-npm-release.mjs <package.json>');

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageJson.name)}`;
  const registryResponse = await fetch(registryUrl);
  if (!registryResponse.ok)
    throw new Error(`Unable to read ${packageJson.name} metadata from npm: ${registryResponse.status}`);
  const registryMetadata = await registryResponse.json();

  console.log(verifyReleaseCandidate(packageJson, registryMetadata));
}

export function verifyReleaseCandidate(packageJson, registryMetadata) {
  const candidate = parseVersion(packageJson.version);
  const publishedVersions = Object.keys(registryMetadata.versions ?? {});

  if (publishedVersions.includes(packageJson.version))
    throw new Error(`${packageJson.name}@${packageJson.version} is already published`);

  const distTags = registryMetadata['dist-tags'] ?? {};
  const requiredTags = candidate.prerelease.length ? ['latest', 'next'] : ['latest'];
  const comparedTags = [];
  for (const tag of requiredTags) {
    const taggedVersion = distTags[tag];
    if (!taggedVersion)
      continue;
    if (compareVersions(candidate, parseVersion(taggedVersion)) <= 0) {
      throw new Error(
        `${packageJson.name}@${packageJson.version} must be newer than the ${tag} dist-tag ${taggedVersion}`,
      );
    }
    comparedTags.push(`${tag} (${taggedVersion})`);
  }

  return `${packageJson.name}@${packageJson.version} is unpublished and newer than ${comparedTags.join(' and ') || 'the required npm dist-tags'}`;
}

function parseVersion(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(version);
  if (!match)
    throw new Error(`Invalid SemVer version: ${version}`);
  return {
    core: match.slice(1, 4).map(Number),
    prerelease: match[4]?.split('.') ?? [],
  };
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a.core[i] !== b.core[i])
      return a.core[i] - b.core[i];
  }
  if (!a.prerelease.length || !b.prerelease.length)
    return Number(!a.prerelease.length) - Number(!b.prerelease.length);
  for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i++) {
    const left = a.prerelease[i];
    const right = b.prerelease[i];
    if (left === undefined || right === undefined)
      return Number(right === undefined) - Number(left === undefined);
    if (left === right)
      continue;
    const leftNumeric = /^\d+$/.test(left);
    const rightNumeric = /^\d+$/.test(right);
    if (leftNumeric && rightNumeric)
      return Number(left) - Number(right);
    if (leftNumeric !== rightNumeric)
      return leftNumeric ? -1 : 1;
    return left < right ? -1 : 1;
  }
  return 0;
}

function isMainModule() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}
