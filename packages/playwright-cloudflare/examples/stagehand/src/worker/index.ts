import { LogLine, Stagehand } from "@browserbasehq/stagehand";
import { acquire, endpointURLString } from "@cloudflare/playwright";
import { z } from "zod";
import { WorkersAIClient } from "./workersAIClient";
import { startScreencast } from "./screencast";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname !== "/movie")
      return new Response("Not found", { status: 404 });

    if (request.headers.get('Upgrade') !== 'websocket')
      return new Response('Expected Upgrade: websocket', { status: 426 });

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    
    server.accept();

    const logger = (line: LogLine) => server.send(JSON.stringify({ type: "log", data: line }));

    const run = async () => {
      const { sessionId } = await acquire(env.BROWSER);
      // Get the CDP URL from browser rendering binding
      const cdpUrl = endpointURLString(env.BROWSER, { sessionId });
      const stagehand = new Stagehand({
        env: "LOCAL",
        localBrowserLaunchOptions: { cdpUrl },
        llmClient: new WorkersAIClient(env.AI, { logger }),
        logger,
        verbose: 1,
      });
  
      await stagehand.init();
      const page = stagehand.page;

      startScreencast(server, page);

      try {
        await page.goto('https://demo.playwright.dev/movies');
    
        // if search is a multi-step action, stagehand will return an array of actions it needs to act on
        const actions = await page.observe('Search for "Furiosa"');
        for (const action of actions)
          await page.act(action);

        await page.act('Click the search result');
        
        // normal playwright functions work as expected
        await page.waitForSelector('.info-wrapper .cast');

        let movieInfo = await page.extract({
          instruction: 'Extract movie information',
          schema: z.object({
            title: z.string(),
            year: z.number(),
            rating: z.number(),
            genres: z.array(z.string()),
            duration: z.number().describe("Duration in minutes"),
          }),
        });

        server.send(JSON.stringify({ type: "extracted", data: movieInfo }));
      } catch (e) {
        const { message, stack } = e as Error;
        server.send(JSON.stringify({ type: "error", data: { message, stack } }));
      } finally {
        await stagehand.close();
      }
    };
    ctx.waitUntil(run());

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  },
};
