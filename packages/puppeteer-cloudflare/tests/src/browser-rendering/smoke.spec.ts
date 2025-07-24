import {expect} from 'expect';

import {getTestState} from '../server/mocha-utils.js';

test('should perform basic interactions @smoke', async () => {
  const {page} = getTestState();

  // Navigate the page to a URL.
  await page.goto('https://pptr.dev/');

  // Set screen size.
  await page.setViewport({width: 1080, height: 1024});

  await page.locator('.DocSearch-Button').click();

  // Type into search box.
  await page.locator('.DocSearch-Input').fill('Getting started');

  // Wait and click on first result.
  await page.locator('.DocSearch-Hit-title:nth-child(1)').click();

  // Locate the full title with a unique string.
  // eslint-disable-next-line rulesdir/use-using
  const textSelector = await page
    .locator('h1 ::-p-text(Getting started)')
    .waitHandle();
  const fullTitle = await textSelector?.evaluate(el => {
    return el.textContent?.trim();
  });

  expect(fullTitle).toBe('Getting started');
});

test('should fetch HTML content @smoke', async () => {
  const {page} = getTestState();

  const expected = await fetch('https://example.com/')
    .then(async (response) => {
      return await response.text();
    });

  const response = await page.goto('https://example.com/');
  const html = await response!.text();

  expect(html).toBe(expected);
});

test('should generate PDF @smoke', async () => {
  const {page} = getTestState();

  await page.goto('https://example.com/');
  const pdf = await page.pdf();

  expect(pdf).toBeDefined();

  // Verify PDF magic bytes
  expect(Array.from(pdf.subarray(0, 4))).toEqual([0x25, 0x50, 0x44, 0x46]); // '%PDF'
});

test('should capture screenshot @smoke', async () => {
  const {page} = getTestState();

  await page.goto('https://example.com/');
  const img = await page.screenshot();

  expect(img).toBeDefined();

  // Verify PNG magic bytes
  expect(Array.from(img.subarray(0, 4))).toEqual([0x89, 0x50, 0x4E, 0x47]); // '\x89PNG'
});

test('should evaluate JavaScript @smoke', async () => {
  const {page} = getTestState();

  const meaningOfLife = await page.evaluate(() => {
    function meaningOfLife() {
      return 42;
    }
    return meaningOfLife();
  });

  expect(meaningOfLife).toBe(42);
});

test('should handle XPath selectors @smoke', async () => {
  const {page} = getTestState();

  await page.setContent('<h1>Hello, World!</h1>');
  await page.waitForSelector('xpath///h1[text()="Hello, World!"]');
  const content = await page.$eval('xpath///h1[text()="Hello, World!"]', e => {
    return e.textContent;
  });

  expect(content).toBe('Hello, World!');
});

test('should collect code coverage @smoke', async () => {
  const {page} = getTestState();

  await Promise.all([
    page.coverage.startJSCoverage(),
    page.coverage.startCSSCoverage(),
  ]);
  // Navigate to page
  await page.goto('https://example.com');
  // Disable both JavaScript and CSS coverage
  const [jsCoverage, cssCoverage] = await Promise.all([
    page.coverage.stopJSCoverage(),
    page.coverage.stopCSSCoverage(),
  ]);
  let totalBytes = 0;
  let usedBytes = 0;
  const coverage = [...jsCoverage, ...cssCoverage];
  for (const entry of coverage) {
    totalBytes += entry.text.length;
    for (const range of entry.ranges) {
      usedBytes += range.end - range.start - 1;
    }
  }

  const usagePercentage = `Bytes used: ${(usedBytes / totalBytes) * 100}%`;

  expect(usagePercentage).toBe("Bytes used: 78.76923076923077%");
});

test('should evaluate on new document @smoke', async () => {
  const {page} = getTestState();
  
  await page.evaluateOnNewDocument(() => {
    function meaningOfLife() {
      return 42;
    }
    (globalThis as any).meaningOfLife = meaningOfLife();
  });
  
  // Navigate the page to a URL.
  await page.goto('https://developer.chrome.com/');
  const meaningOfLife = await page.evaluate(() => {
    return (globalThis as any).meaningOfLife;
  });

  expect(meaningOfLife).toBe(42);
});

test('should handle tracing @smoke', async () => {
  const {page} = getTestState();
  
  await page.tracing.start();
  await page.goto('https://example.com/');

  const result = await page.tracing.stop();

  expect(result).toBeDefined();
  if (result) {
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    // Verify it contains tracing data (should be truthy)
    expect(!!result).toBe(true);
  }
});
