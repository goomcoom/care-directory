import { useSyncExternalStore } from "react";
import type { ChatRequest, ChatResponse } from "../shared/schemas";
import { simulatedChat } from "./simulate";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---- Mode: live Claude API via the server, or simulated canned responses ----

export type ApiMode = "probing" | "live" | "simulated";

let mode: ApiMode = "probing";
const listeners = new Set<() => void>();

function setMode(next: ApiMode) {
  mode = next;
  listeners.forEach((fn) => fn());
}

export function useApiMode(): ApiMode {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => mode,
  );
}

const forceSimulated = import.meta.env.VITE_SIMULATE === "true";

async function probe(): Promise<ApiMode> {
  if (forceSimulated) return "simulated";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("/api/health", { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return "simulated";
    const body = (await res.json()) as { ok?: boolean; hasKey?: boolean };
    return body.ok && body.hasKey ? "live" : "simulated";
  } catch {
    // No server (static hosting), network error, or HTML instead of JSON.
    return "simulated";
  }
}

const ready: Promise<ApiMode> = probe().then((m) => {
  setMode(m);
  return m;
});

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Could not reach the Care Directory server. Is `npm run dev` running?", 0);
  }
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new ApiError(payload.error ?? `Request failed with status ${response.status}`, response.status);
  }
  return payload as T;
}

function abortable<T>(work: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return work;
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}

export const api = {
  async chat(input: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    if ((await ready) === "simulated") return abortable(simulatedChat(input), signal);
    return post<ChatResponse>("/api/chat", input, signal);
  },
};
