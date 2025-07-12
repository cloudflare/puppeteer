# Workers version of Puppeteer Core

This repo is a fork of main puppeteer project. It creates a version of
puppeteer core specialized for use in Cloudflare workers.

The goals of the fork are:

- Support as much of the existing puppeteer core lib as possible.
- Minimize the size of the library for workers developers, since library
  space is at a premium in workers projects.
- Make library use as seamless as possible in workers.

Note that the main branch in this repo is branched off of version 22.8.2 of
the library, to match the currently deployed version of Chromium on the
edge.

More information in the [developer docs](https://developers.cloudflare.com/browser-rendering/).

Original README follows...

# Puppeteer

[![build](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/puppeteer/puppeteer/actions/workflows/ci.yml)
[![npm puppeteer package](https://img.shields.io/npm/v/puppeteer.svg)](https://npmjs.org/package/puppeteer)

<img src="https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png" height="200" align="right"/>

> Puppeteer is a Node.js library which provides a high-level API to control
> Chrome or Firefox over the
> [DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) or [WebDriver BiDi](https://pptr.dev/webdriver-bidi).
> Puppeteer runs in the headless (no visible UI) by default
> but can be configured to run in a visible ("headful") browser.

## [Get started](https://pptr.dev/docs) | [API](https://pptr.dev/api) | [FAQ](https://pptr.dev/faq) | [Contributing](https://pptr.dev/contributing) | [Troubleshooting](https://pptr.dev/troubleshooting)

## Installation

```bash npm2yarn
npm i puppeteer # Downloads compatible Chrome during installation.
npm i puppeteer-core # Alternatively, install as a library, without downloading Chrome.
```

## Example

```ts
import puppeteer from 'puppeteer';
// Or import puppeteer from 'puppeteer-core';

// Launch the browser and open a new blank page
const browser = await puppeteer.launch();
const page = await browser.newPage();

// Navigate the page to a URL.
await page.goto('https://developer.chrome.com/');

// Set screen size.
await page.setViewport({width: 1080, height: 1024});

// Type into search box.
await page.locator('.devsite-search-field').fill('automate beyond recorder');

// Wait and click on first result.
await page.locator('.devsite-result-item-link').click();

// Locate the full title with a unique string.
const textSelector = await page
  .locator('text/Customize and automate')
  .waitHandle();
const fullTitle = await textSelector?.evaluate(el => el.textContent);

// Print the full title.
console.log('The title of this blog post is "%s".', fullTitle);

await browser.close();
```

### Default runtime settings

**1. Uses Headless mode**

By default Puppeteer launches Chrome in
[old Headless mode](https://developer.chrome.com/articles/new-headless/).

```ts
const browser = await puppeteer.launch();
// Equivalent to
const browser = await puppeteer.launch({headless: true});
```

[Chrome 112 launched a new Headless mode](https://developer.chrome.com/articles/new-headless/) that might cause some differences in behavior compared to the old Headless implementation.
In the future Puppeteer will start defaulting to new implementation.
We recommend you try it out before the switch:

```ts
const browser = await puppeteer.launch({headless: 'new'});
```

To launch a "headful" version of Chrome, set the
[`headless`](https://pptr.dev/api/puppeteer.browserlaunchargumentoptions) to `false`
option when launching a browser:

```ts
const browser = await puppeteer.launch({headless: false});
```

**2. Runs a bundled version of Chrome**

By default, Puppeteer downloads and uses a specific version of Chrome so its
API is guaranteed to work out of the box. To use Puppeteer with a different
version of Chrome or Chromium, pass in the executable's path when creating a
`Browser` instance:

```ts
const browser = await puppeteer.launch({executablePath: '/path/to/Chrome'});
```

You can also use Puppeteer with Firefox. See
[status of cross-browser support](https://pptr.dev/faq/#q-what-is-the-status-of-cross-browser-support) for
more information.

See
[`this article`](https://www.howtogeek.com/202825/what%E2%80%99s-the-difference-between-chromium-and-chrome/)
for a description of the differences between Chromium and Chrome.
[`This article`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/chromium_browser_vs_google_chrome.md)
describes some differences for Linux users.

**3. Creates a fresh user profile**

Puppeteer creates its own browser user profile which it **cleans up on every
run**.

#### Using Docker

See our [Docker guide](https://pptr.dev/guides/docker).

#### Using Chrome Extensions

See our [Chrome extensions guide](https://pptr.dev/guides/chrome-extensions).

## Resources

- [API Documentation](https://pptr.dev/api)
- [Guides](https://pptr.dev/category/guides)
- [Examples](https://github.com/puppeteer/puppeteer/tree/main/examples)
- [Community list of Puppeteer resources](https://github.com/transitive-bullshit/awesome-puppeteer)

## Contributing

Check out our [contributing guide](https://pptr.dev/contributing) to get an
overview of Puppeteer development.

## FAQ

Our [FAQ](https://pptr.dev/faq) has migrated to
[our site](https://pptr.dev/faq).

> > > > > > > main
