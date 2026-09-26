import express, { type Request, type Response } from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod/v4";
import { ChatRequest } from "../shared/schemas";
import { MODEL, runAgent } from "./claude.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

type Handler<T> = (input: T) => Promise<unknown>;

function route<S extends z.ZodType>(schema: S, handler: Handler<z.infer<S>>) {
  return async (req: Request, res: Response) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: z.prettifyError(parsed.error) });
      return;
    }
    const started = Date.now();
    try {
      const result = await handler(parsed.data);
      console.log(`${req.path} ok in ${Date.now() - started}ms`);
      res.json(result);
    } catch (err) {
      const message = describeError(err);
      console.error(`${req.path} failed after ${Date.now() - started}ms: ${message}`);
      res.status(statusFor(err)).json({ error: message });
    }
  };
}

function describeError(err: unknown): string {
  if (err instanceof Error && /Could not resolve authentication method/i.test(err.message)) {
    return "No Claude API key is configured on the server. Add ANTHROPIC_API_KEY to .env and restart `npm run dev`.";
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return "The server could not authenticate with the Claude API. Check ANTHROPIC_API_KEY in .env.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "The Claude API is rate limiting requests. Wait a moment and retry.";
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "The server could not reach the Claude API.";
  }
  if (err instanceof Anthropic.APIError) {
    return `Claude API error ${err.status}: ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

function statusFor(err: unknown): number {
  if (err instanceof Error && /Could not resolve authentication method/i.test(err.message)) return 503;
  if (err instanceof Anthropic.AuthenticationError) return 401;
  if (err instanceof Anthropic.RateLimitError) return 429;
  if (err instanceof Anthropic.APIConnectionError) return 502;
  return 500;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.post("/api/chat", route(ChatRequest, runAgent));

const port = Number(process.env.API_PORT ?? 3002);
app.listen(port, () => {
  console.log(`Care Directory API on http://localhost:${port} (model ${MODEL})`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY is not set. Add it to .env or /api/chat will fail; the web app will fall back to simulated mode.");
  }
});
