export const skipTests: string[] = [
    // TODO: Remove these six skips after Browser Run upgrades to Chrome 146 or
    // newer. Chrome 128 ignores windowBounds/background, lacks setContentsSize,
    // reports the fixed iframe element as non-clickable, and accepts the inline
    // script despite the Worker-hosted CSP setup.
    "page.spec.ts > Page > Page.newPage > should open pages in a new window at the specified position",
    "page.spec.ts > Page > Page.newPage > should open pages in a new window in maximized state",
    "page.spec.ts > Page > Page.resize > should resize the browser window to fit page content",
    "page.spec.ts > Page > Page.newPage > should create a background page",
    "click.spec.ts > Page.click > should click the button with fixed position inside an iframe",
    "page.spec.ts > Page > Page.addScriptTag > should throw when added with content to the CSP page",

    // Browser Run page navigator.userAgent returns Cloudflare-Workers, while CDP
    // Browser.getVersion and request headers use the stock or overridden Chrome
    // UA. The page UA ignores explicit UA overrides, although platform overrides
    // work, so upstream platform consistency, device emulation, and reset
    // assertions cannot hold.
    "page.spec.ts > Page > Page.setUserAgent > should work with platform option without userAgent",
    "page.spec.ts > Page > Page.setUserAgent > should restore original",
    "page.spec.ts > Page > Page.setUserAgent > should emulate device user-agent",

    // These match Puppeteer's own TestExpectations.json. This Worker runner
    // cannot represent expected failures, so it records them as explicit skips.
    "coverage.spec.ts > Coverage specs > JSCoverage > should not hang when there is a debugger statement",
    "evaluation.spec.ts > Evaluation specs > Page.evaluate > should transfer RegEx",
    "evaluation.spec.ts > Evaluation specs > Page.evaluate > should return RegEx",
    "navigation.spec.ts > navigation > Page.goto > should work when navigating to a URL with a client redirect",

    "oopif.spec.ts > OOPIF > should treat OOP iframes and normal iframes the same",
    "oopif.spec.ts > OOPIF > should track navigations within OOP iframes",
    "oopif.spec.ts > OOPIF > should support OOP iframes becoming normal iframes again",
    "oopif.spec.ts > OOPIF > should support frames within OOP frames",
    "oopif.spec.ts > OOPIF > should recover cross-origin frames on reconnect",
    "oopif.spec.ts > OOPIF > should support OOP iframes getting detached",
    "oopif.spec.ts > OOPIF > should support wait for navigation for transitions from local to OOPIF",
    "oopif.spec.ts > OOPIF > should keep track of a frames OOP state",
    "oopif.spec.ts > OOPIF > should support evaluating in oop iframes",
    "oopif.spec.ts > OOPIF > should provide access to elements",
    "oopif.spec.ts > OOPIF > should report oopif frames",
    "oopif.spec.ts > OOPIF > should wait for inner OOPIFs",
    "oopif.spec.ts > OOPIF > should load oopif iframes with subresources and request interception",
    "oopif.spec.ts > OOPIF > should support frames within OOP iframes",
    "oopif.spec.ts > OOPIF > clickablePoint, boundingBox, boxModel should work for elements inside OOPIFs",
    "oopif.spec.ts > OOPIF > should detect existing OOPIFs when Puppeteer connects to an existing page",
    "oopif.spec.ts > OOPIF > should support lazy OOP frames",
    "oopif.spec.ts > OOPIF > should exposeFunction on a page with a PDF viewer",
    "oopif.spec.ts > OOPIF > should evaluate on a page with a PDF viewer",
    "oopif.spec.ts > OOPIF > should support evaluateOnNewDocument",
    "oopif.spec.ts > OOPIF > should support removing evaluateOnNewDocument scripts",
    "oopif.spec.ts > OOPIF > should support exposeFunction",
    "oopif.spec.ts > OOPIF > should support removing exposed function",
    "oopif.spec.ts > OOPIF > waitForFrame > should resolve immediately if the frame already exists",
    "oopif.spec.ts > OOPIF > should report google.com frame",
    "oopif.spec.ts > OOPIF > should expose events within OOPIFs",
    "page.spec.ts > Page > Page.setUserAgent > should work",
    "page.spec.ts > Page > Page.setUserAgent > should work for subframes",
    "page.spec.ts > Page > Page.addScriptTag > should work with a path and type=module",
    "page.spec.ts > Page > Page.addScriptTag > should work with a path",
    "page.spec.ts > Page > Page.addScriptTag > should include sourcemap when path is provided",
    "page.spec.ts > Page > Page.addStyleTag > should work with a path",
    "page.spec.ts > Page > Page.addStyleTag > should include sourcemap when path is provided",
    "elementhandle.spec.ts > ElementHandle specs > ElementHandle[Symbol.dispose] > should work",
    "elementhandle.spec.ts > ElementHandle specs > ElementHandle[Symbol.asyncDispose] > should work",
    "elementhandle.spec.ts > ElementHandle specs > ElementHandle.move > should work",
    "cookies.spec.ts > Cookie specs > Page.cookies > should get a cookie",
    "cookies.spec.ts > Cookie specs > Page.cookies > should get multiple cookies",
    "cookies.spec.ts > Cookie specs > Page.setCookie > should set cookie with reasonable defaults",
    "cookies.spec.ts > Cookie specs > Page.setCookie > should set a cookie with a path",
    "cookies.spec.ts > Cookie specs > Page.setCookie > should set cookies from a frame",
    "cookies.spec.ts > Cookie specs > Page.deleteCookie > should delete cookie for specified URL",
    "locator.spec.ts > Locator > Locator.click > should time out",
    "locator.spec.ts > Locator > Locator.click > should retry clicks on errors",
    "locator.spec.ts > Locator > Locator.click > can be aborted",
    "locator.spec.ts > Locator > Locator.race > can be aborted",
    "locator.spec.ts > Locator > Locator.race > should time out when all locators do not match",
    "locator.spec.ts > Locator > Locator.prototype.filter > should resolve as soon as the predicate matches",
    "navigation.spec.ts > navigation > Page.goto > should fail when navigating to bad SSL",
    // Workers.dev always presents valid managed TLS, so the remote TestServer
    // cannot provide the invalid certificate required by this upstream test.
    "navigation.spec.ts > navigation > Page.goto > should fail when navigating to bad SSL after redirects",
    "navigation.spec.ts > navigation > Page.goto > should not leak listeners during navigation",
    "navigation.spec.ts > navigation > Page.goto > should not leak listeners during bad navigation",
    "navigation.spec.ts > navigation > Page.goto > should not leak listeners during navigation of 11 pages",
    "navigation.spec.ts > navigation > Page.goto > should fail when navigating and show the url at the error message",
    "coverage.spec.ts > Coverage specs > JSCoverage > should work with conditionals",
    "coverage.spec.ts > Coverage specs > CSSCoverage > should work with complicated usecases",
    "evaluation.spec.ts > Evaluation specs > Page.evaluate > should replace symbols with undefined",
    "evaluation.spec.ts > Evaluation specs > Page.evaluate > should work for circular object",
    "evaluation.spec.ts > Evaluation specs > Page.evaluate > should transfer 100Mb of data from page to node.js",
    "evaluation.spec.ts > Evaluation specs > Page.evaluate > should return properly serialize objects with unknown type fields",
    "jshandle.spec.ts > JSHandle > JSHandle.toString > should work with window subtypes",
    "jshandle.spec.ts > JSHandle > JSHandle[Symbol.dispose] > should work",
    "jshandle.spec.ts > JSHandle > JSHandle[Symbol.asyncDispose] > should work",
    "jshandle.spec.ts > JSHandle > JSHandle.move > should work",
    "dialog.spec.ts > Page.Events.Dialog > should fire",
    "dialog.spec.ts > Page.Events.Dialog > should allow accepting prompts",
    "frame.spec.ts > Frame specs > Frame Management > should handle nested frames",
    "input.spec.ts > input tests > ElementHandle.uploadFile > should read the file",
    "input.spec.ts > input tests > FileChooser.accept > should be able to read selected file",
    "mouse.spec.ts > Mouse > should not throw if buttons are pressed twice",
    "mouse.spec.ts > Mouse > should reset properly",
    "drag-and-drop.spec.ts > Drag n\\' Drop > should drag and drop",
    "keyboard.spec.ts > Keyboard > should send a character with sendCharacter in iframe",
    "jshandle.spec.ts > JSHandle > JSHandle.jsonValue > should work with dates",
    "jshandle.spec.ts > JSHandle > JSHandle.jsonValue > should not throw for circular objects",
    "keyboard.spec.ts > Keyboard > ElementHandle.press should not support |text| option",
    "page.spec.ts > Page > Page.pdf > can print to PDF and save to file",

    // Browser Run shares a remote browser session across tests. Crashing a page
    // destroys that session rather than only the target under test.
    "page.spec.ts > Page > Page.Events.error > should throw when page crashes",

    // Worker isolates disable dynamic code generation. Puppeteer's custom query
    // registration path compiles user handlers with Function constructors.
    "elementhandle.spec.ts > ElementHandle specs > Custom queries > should register and unregister",
    "elementhandle.spec.ts > ElementHandle specs > Custom queries > should work for multiple elements",
    "elementhandle.spec.ts > ElementHandle specs > Custom queries > should eval correctly",
    "elementhandle.spec.ts > ElementHandle specs > Custom queries > should wait correctly with waitForSelector",
    "elementhandle.spec.ts > ElementHandle specs > Custom queries > should wait correctly with waitForSelector on an element",
    "elementhandle.spec.ts > ElementHandle specs > Custom queries > should work when both queryOne and queryAll are registered",
    "elementhandle.spec.ts > ElementHandle specs > Custom queries > should eval when both queryOne and queryAll are registered",
    "elementhandle.spec.ts > ElementHandle specs > Custom queries > should work with function shorthands",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in Page > should query existing element",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in Page > should return empty array for non-existing element",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in Page > should return first element",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in Page > should pierce shadow DOM",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in Page > should query deeply nested text",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in Page > should query inputs",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in Page > should not query radio",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in Page > should query text spanning multiple elements",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in Page > should clear caches",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in ElementHandles > should query existing element",
    "queryhandler.spec.ts > Query handler tests > Text selectors > in ElementHandles > should return null for non-existing element",
    "queryhandler.spec.ts > Query handler tests > P selectors > should work with custom selectors",
    "queryhandler.spec.ts > Query handler tests > P selectors > should work with custom selectors with args",
    "queryselector.spec.ts > querySelector > QueryAll > should have registered handler",
    "queryselector.spec.ts > querySelector > QueryAll > $$ should query existing elements",
    "queryselector.spec.ts > querySelector > QueryAll > $$ should return empty array for non-existing elements",
    "queryselector.spec.ts > querySelector > QueryAll > $$eval should work",
    "queryselector.spec.ts > querySelector > QueryAll > $$eval should accept extra arguments",
    "queryselector.spec.ts > querySelector > QueryAll > $$eval should accept ElementHandles as arguments",
    "queryselector.spec.ts > querySelector > QueryAll > $$eval should handle many elements",

    // These assertions depend on localhost URLs, socket failure modes, or
    // redirect history that the deployed workers.dev TestServer cannot match.
    "evaluation.spec.ts > Evaluation specs > Frame.evaluate > should execute after cross-site navigation",
    "navigation.spec.ts > navigation > Page.goto > should fail when main resources failed to load",
    "navigation.spec.ts > navigation > Page.goBack > should work",

    // Browser Run returns concrete CdpCDPSession objects from the bundled copy;
    // they cannot satisfy instanceof checks against the test bundle's copy.
    "frame.spec.ts > Frame specs > Frame.client > should return the client instance",
    "page.spec.ts > Page > Page.client > should return the client instance",

    // The Worker bundle renames the injected helper, so createFunction3 is not
    // available under the identifier expected by this direct utility test.
    "injected.spec.ts > PuppeteerUtil tests > createFunction tests > should work",
    // Serialized race candidates lose the concrete locator type required by
    // Locator.race and produce "Unknown locator for race candidate".
    "locator.spec.ts > Locator > Locator.race > races multiple locators",
    "locator.spec.ts > Locator > Locator.race > should not time out when one of the locators matches",
    // The generated Worker test has no Mocha context for this.timeout().
    "queryselector.spec.ts > querySelector > Page.$$eval > should handle many elements",
    // Bundling removes the source filename that this test requires in the stack.
    "page.spec.ts > Page > Page.exposeFunction > should throw exception in page context",
];
