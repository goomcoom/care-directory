import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, MapPinned } from "lucide-react";
import { PROVIDER_BY_ID, TOWN } from "../../shared/directory";
import type { ChatRequest } from "../../shared/schemas";
import type { AgentStep, AssistantMessage, ChatMessage } from "../../shared/types";
import { api } from "../api";
import { AppShell } from "../components/AppShell";
import { ChatThread, type TurnState } from "../components/ChatThread";
import { ProviderCard } from "../components/ProviderCard";
import { TownMap } from "../components/TownMap";
import { newId } from "../format";
import { appendMessage, getState, setHighlighted, useStore } from "../store";

/** Delay between revealed steps so the agent's work is legible. */
const STEP_MS = 650;
const HISTORY_LIMIT = 12;

function toRequest(messages: ChatMessage[]): ChatRequest {
  return {
    messages: messages.slice(-HISTORY_LIMIT).map((m) =>
      m.role === "user"
        ? { role: "user" as const, text: m.text }
        : { role: "assistant" as const, text: [m.text, m.followUp].filter(Boolean).join("\n\n") },
    ),
    now: new Date().toISOString(),
  };
}

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

export function FindPage() {
  const { messages, highlighted } = useStore();
  const [turn, setTurn] = useState<TurnState>({ status: "idle" });
  const [now, setNow] = useState(() => new Date());
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => {
      clearInterval(t);
      abortRef.current?.abort();
    };
  }, []);

  async function run(history: ChatMessage[]) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setTurn({ status: "running", steps: [], done: 0 });
    try {
      const response = await api.chat(toRequest(history), controller.signal);
      // Replay the agent's steps one by one, then reveal the answer.
      const steps: AgentStep[] = response.steps;
      setTurn({ status: "running", steps, done: 0 });
      for (let i = 0; i < steps.length; i++) {
        await wait(STEP_MS, controller.signal);
        setTurn({ status: "running", steps, done: i + 1 });
      }
      await wait(steps.length ? 450 : 250, controller.signal);
      const message: AssistantMessage = {
        id: newId("msg"),
        role: "assistant",
        text: response.answer.reply,
        recommendations: response.answer.recommendations,
        followUp: response.answer.followUp,
        safety: response.answer.safety,
        steps,
        at: new Date().toISOString(),
      };
      appendMessage(message);
      setNow(new Date());
      setTurn({ status: "idle" });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setTurn({ status: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  const send = (text: string) => {
    if (turn.status === "running") return;
    const user: ChatMessage = { id: newId("msg"), role: "user", text, at: new Date().toISOString() };
    appendMessage(user);
    void run(getState().messages);
  };

  const retry = () => void run(getState().messages);

  const showOnMap = (id: string) => setHighlighted([id]);

  const recommended = highlighted.map((id) => PROVIDER_BY_ID[id]).filter(Boolean);

  return (
    <AppShell>
      <div className="grid-2 find-grid">
        <ChatThread
          messages={messages}
          turn={turn}
          now={now}
          highlighted={highlighted}
          onSend={send}
          onRetry={retry}
          onShowOnMap={showOnMap}
        />
        <aside className="map-side">
          <section className="card map-card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="row" style={{ gap: 8, fontWeight: 600 }}>
                <MapPinned size={15} />
                {TOWN}
              </span>
              <span className="hint">Fictional town · schematic</span>
            </div>
            <TownMap highlighted={highlighted} onSelect={(id) => navigate(`/directory/${id}`)} />
            <div className="map-legend">
              <span className="row" style={{ gap: 6 }}>
                <span className="pill-dot" style={{ background: "var(--accent)" }} />
                Recommended
              </span>
              <span className="row" style={{ gap: 6 }}>
                <span className="pill-dot" style={{ background: "var(--faint)" }} />
                Other providers
              </span>
              <span className="hint" style={{ marginLeft: "auto" }}>
                Click a dot for details
              </span>
            </div>
          </section>
          {recommended.length > 0 && (
            <section className="stack" style={{ gap: 10 }}>
              <span className="section-label row" style={{ gap: 6 }}>
                <Compass size={13} />
                Recommended now
              </span>
              {recommended.map((p) => (
                <ProviderCard key={p!.id} provider={p!} now={now} compact />
              ))}
            </section>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
