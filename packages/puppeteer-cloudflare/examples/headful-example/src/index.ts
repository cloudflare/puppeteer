import puppeteer from "@cloudflare/puppeteer";

interface Env {
	BROWSER: Fetcher;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const targetUrl = url.searchParams.get("url") || "https://example.com";

		const browser = await puppeteer.launch(env.BROWSER);
		const page = await browser.newPage();

		await page.goto(targetUrl);
		const title = await page.title();
		const screenshot = await page.screenshot({ type: "png" });

		console.log("Waiting 5 seconds...");
		await new Promise((resolve) => setTimeout(resolve, 5000));

		await browser.close();
		console.log("Browser closed");

		return new Response(screenshot as any, {
			headers: {
				"Content-Type": "image/png",
				"X-Page-Title": title,
			},
		});
	},
};
