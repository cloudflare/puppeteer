import type { Page } from "playwright";

// 4 frames per second
const throttleMs = 250;

export async function startScreencast(server: WebSocket, page: Page) {
  try {
    const cdpSession = await page.context().newCDPSession(page);
    let lastSent = 0;
    cdpSession.on("Page.screencastFrame", async frame => {
      const now = Date.now();
      if (now - lastSent >= throttleMs) {
        server.send(JSON.stringify({
          type: "screenshot",
          data: { mimetype: "image/jpeg", base64: frame.data }
        }));
        lastSent = now;
      }
      cdpSession.send("Page.screencastFrameAck", { sessionId: frame.sessionId });
    });
    await cdpSession.send("Page.startScreencast", {
      format: "jpeg",
      quality: 90,
      maxWidth: page.viewportSize()!.width,
      maxHeight: page.viewportSize()!.height,
    });
  } catch (e) {
    // oh well...
  }
}