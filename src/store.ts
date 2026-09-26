import { useSyncExternalStore } from "react";
import type { ChatMessage } from "../shared/types";

const STORAGE_KEY = "care-directory:v1";

interface State {
  messages: ChatMessage[];
  /** Provider ids highlighted on the map: the last answer's recommendations. */
  highlighted: string[];
}

const EMPTY: State = { messages: [], highlighted: [] };

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (Array.isArray(parsed.messages) && Array.isArray(parsed.highlighted)) return parsed;
    }
  } catch {
    // fall through to empty
  }
  return EMPTY;
}

let state: State = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage may be unavailable; keep in-memory state
  }
}

function setState(next: State) {
  state = next;
  persist();
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, () => state);
}

export function getState(): State {
  return state;
}

export function appendMessage(message: ChatMessage) {
  const highlighted =
    message.role === "assistant" && message.recommendations.length > 0
      ? message.recommendations.map((r) => r.providerId)
      : state.highlighted;
  setState({ messages: [...state.messages, message], highlighted });
}

export function setHighlighted(ids: string[]) {
  setState({ ...state, highlighted: ids });
}

export function resetDemoData() {
  setState(EMPTY);
}
