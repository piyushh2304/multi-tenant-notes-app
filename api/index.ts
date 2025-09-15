import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../server/index';

// Create the Express app once per cold start
const app = createServer();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Delegate to Express
  // @ts-expect-error Express types differ from Vercel's, but req/res are compatible
  return app(req, res);
}
