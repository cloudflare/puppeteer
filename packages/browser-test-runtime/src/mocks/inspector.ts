export function url(): undefined {
  return undefined;
}

export class Session {
  constructor() {
    throw new Error('Node.js inspector sessions are not supported in Workers');
  }
}

export default {url, Session};
