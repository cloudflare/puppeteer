// Bindings to other Browser Run environments. They are not in wrangler.toml, so
// `wrangler types` does not generate them; tests select them with `?binding=`.
interface BrowserRunEnvironmentBindings {
  BROWSER_BRAPI_STAGING: BrowserRun;
  BROWSER_BRAPI_PRODUCTION: BrowserRun;
}

declare namespace Cloudflare {
  interface Env extends BrowserRunEnvironmentBindings {}
}

interface Env extends BrowserRunEnvironmentBindings {}
