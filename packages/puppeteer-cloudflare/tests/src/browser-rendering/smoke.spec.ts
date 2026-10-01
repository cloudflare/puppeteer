import {expect} from 'expect';

import {getTestState} from '../server/mocha-utils.js';

test('should perform basic interactions @smoke', async () => {
  const {page, server} = getTestState();

  await page.goto(server.EMPTY_PAGE);

  // Set screen size.
  await page.setViewport({width: 1080, height: 1024});
  await page.setContent(`
    <input aria-label="Title">
    <button onclick="document.querySelector('h1').textContent = document.querySelector('input').value">Update</button>
    <h1></h1>
  `);
  await page.locator('input').fill('Getting started');
  await page.locator('button').click();
  expect(await page.locator('h1').map(element => element.textContent).wait()).toBe(
    'Getting started',
  );
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

// Use the coverage pages from the Puppeteer test assets, which the test
// Worker serves. A live third-party page changes its markup over time.
test('should collect code coverage @smoke', async () => {
  const {page, server} = getTestState();

  await page.coverage.startJSCoverage();
  await page.goto(server.PREFIX + '/jscoverage/simple.html', {
    waitUntil: 'load',
  });
  const jsCoverage = await page.coverage.stopJSCoverage();
  expect(jsCoverage).toHaveLength(1);
  expect(jsCoverage[0]!.url).toContain('/jscoverage/simple.html');
  expect(jsCoverage[0]!.ranges).toEqual([
    {start: 0, end: 17},
    {start: 35, end: 61},
  ]);

  await page.coverage.startCSSCoverage();
  await page.goto(server.PREFIX + '/csscoverage/simple.html');
  const cssCoverage = await page.coverage.stopCSSCoverage();
  expect(cssCoverage).toHaveLength(1);
  expect(cssCoverage[0]!.url).toContain('/csscoverage/simple.html');
  expect(cssCoverage[0]!.ranges).toEqual([{start: 1, end: 22}]);
  expect(cssCoverage[0]!.text.substring(1, 22)).toBe('div { color: green; }');
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
