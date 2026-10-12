# Release Process

This repository releases `@cloudflare/puppeteer`, `@cloudflare/playwright`, and `@cloudflare/playwright-mcp` independently. Each package has a separate GitHub tag prefix and publish workflow.

| Package | GitHub tag | Publish workflow |
| --- | --- | --- |
| `@cloudflare/puppeteer` | `cloudflare-puppeteer-v<version>` | `cf_puppeteer_publish.yml` |
| `@cloudflare/playwright` | `cloudflare-playwright-v<version>` | `cf_playwright_publish.yml` |
| `@cloudflare/playwright-mcp` | `cloudflare-playwright-mcp-v<version>` | `cf_playwright_mcp_publish.yml` |

The version in the tag must equal the version in the package metadata. A release for one package does not publish the other package.

## Prepare Puppeteer

1. Set the release version.

   ```shell
   VERSION=1.5.0-rc.0
   npm version "$VERSION" --workspace @cloudflare/puppeteer --no-git-tag-version
   npm install --package-lock-only --prefix packages/puppeteer-cloudflare/tests
   ```

2. Examine these files for the new version:

   - `packages/puppeteer-cloudflare/package.json`
   - `package-lock.json`
   - `packages/puppeteer-cloudflare/tests/package-lock.json`

3. Open a pull request with the version change.
4. Merge the pull request after all required tests pass.
5. Wait for the full test suite on `main` to pass.

## Publish Puppeteer

1. Open the GitHub **Releases** page.
2. Create a release from the tested commit on `main`.
3. Set the tag to `cloudflare-puppeteer-v<version>`.
4. If the version has a SemVer prerelease suffix, select **Set as a pre-release**.
5. Publish the GitHub Release.
6. Make sure that the **Puppeteer for Cloudflare - Publish to NPM** workflow passes.

For example, version `1.5.0-rc.0` requires tag `cloudflare-puppeteer-v1.5.0-rc.0`. The GitHub Release must be a prerelease.

## Prepare Playwright

1. Set the release version.

   ```shell
   VERSION=1.0.0-rc.0
   npm version "$VERSION" --workspace @cloudflare/playwright --no-git-tag-version
   npm install --package-lock-only --prefix packages/playwright-cloudflare/tests
   ```

2. Examine these files for the new version:

   - `packages/playwright-cloudflare/package.json`
   - `package-lock.json`
   - `packages/playwright-cloudflare/tests/package-lock.json`

3. Open a pull request with the version change.
4. Merge the pull request after all required tests pass.
5. Wait for the full test suite on `main` to pass.

## Publish Playwright

1. Open the GitHub **Releases** page.
2. Create a release from the tested commit on `main`.
3. Set the tag to `cloudflare-playwright-v<version>`.
4. If the version has a SemVer prerelease suffix, select **Set as a pre-release**.
5. Publish the GitHub Release.
6. Make sure that the **Playwright for Cloudflare - Publish to NPM** workflow passes.

For example, version `1.0.0-rc.0` requires tag `cloudflare-playwright-v1.0.0-rc.0`. The GitHub Release must be a prerelease.

## Prepare Playwright MCP

1. Set the release version. The public example uses `*` so external installs
   resolve the latest published stable package while monorepo tests use the
   workspace package.

   ```shell
   VERSION=0.0.6-rc.0
   npm version "$VERSION" --workspace @cloudflare/playwright-mcp --no-git-tag-version
   npm install --package-lock-only --ignore-scripts
   ```

2. Run the MCP checks.

   ```shell
   npm run check:patch:playwright-mcp
   npm run test:types --workspace @cloudflare/playwright-mcp
   npm run test:bundle --workspace @cloudflare/playwright-mcp
   ```

3. Examine these files for the new version:

   - `packages/playwright-mcp-cloudflare/package.json`
   - `package-lock.json`

4. Open a pull request with the version changes.
5. Merge the pull request after all required tests pass.
6. Wait for the full MCP test suite on `main` to pass. Pull requests from
   branches in this repository also deploy the MCP test Worker and invoke
   `browser_navigate` through `/mcp` against Browser Run. Pull requests from
   forks and Dependabot run only uncredentialed build, type, and Wrangler
   dry-run checks.

## Publish Playwright MCP

1. Open the GitHub **Releases** page.
2. Create a release from the tested commit on `main`.
3. Set the tag to `cloudflare-playwright-mcp-v<version>`.
4. If the version has a SemVer prerelease suffix, select **Set as a pre-release**.
5. Publish the GitHub Release.
6. Make sure that the **Playwright MCP for Cloudflare - Publish to NPM** workflow passes.

For example, version `0.0.1-rc.0` requires tag `cloudflare-playwright-mcp-v0.0.1-rc.0`. The GitHub Release must be a prerelease.

## npm Tags

The publish workflows select the npm distribution tag from the GitHub Release type:

| GitHub Release | Package version | npm distribution tag |
| --- | --- | --- |
| Prerelease | SemVer prerelease, such as `1.5.0-rc.0` | `next` |
| Stable release | Stable SemVer, such as `1.5.0` | `latest` |

The workflow stops before publication when the tag, package version, or GitHub Release type does not match.

## Permissions

A user with repository write access can start a manual test workflow. Repository ownership is not required.

The publish workflows do not have manual triggers. They run only after a user publishes a GitHub Release.

The publish workflows use the repository `NODE_AUTH_TOKEN` secret to publish to npm.
