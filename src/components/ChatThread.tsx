import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AlertTriangle, MapPinned, SendHorizontal, ShieldAlert } from "lucide-react";
import { TOWN } from "../../shared/directory";
import type { AgentStep, ChatMessage } from "../../shared/types";
import { AgentSteps } from "./AgentSteps";
import { MessageBubble } from "./MessageBubble";
import { SuggestedPrompts } from "./SuggestedPrompts";

export type TurnState =
  | { status: "idle" }
  | { status: "running"; steps: AgentStep[]; done: number }
  | { status: "error"; message: string };

interface Props {
  messages: ChatMessage[];
  turn: TurnState;
  now: Date;
  highlighted: string[];
  onSend: (text: string) => void;
  onRetry: () => void;
  onShowOnMap: (id: string) => void;
}

export function ChatThread({ messages, turn, now, highlighted, onSend, onRetry, onShowOnMap }: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const busy = turn.status === "running";

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, turn]);

  const submit = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    onSend(text);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <section className="card chat">
      <div className="thread">
        {messages.length === 0 && turn.status === "idle" ? (
          <div className="thread-empty">
            <span className="thread-empty-icon">
              <MapPinned size={22} />
            </span>
            <h2>What do you need, and where are you?</h2>
            <p>
              Describe what you are looking for in {TOWN} and the assistant will search the directory and point you to the
              best place to go. Try one of these:
            </p>
            <SuggestedPrompts onPick={onSend} />
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              now={now}
              highlighted={highlighted}
              isLatest={m.id === lastAssistantId && !busy}
              busy={busy}
              onSend={onSend}
              onShowOnMap={onShowOnMap}
            />
          ))
        )}
        {turn.status === "running" && <AgentSteps steps={turn.steps} done={turn.done} />}
        {turn.status === "error" && (
          <div className="notice notice-error fade-in" role="alert">
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{turn.message}</span>
            <button type="button" className="btn btn-sm" onClick={onRetry}>
              Retry
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="composer">
        <div className="composer-row">
          <textarea
            className="textarea"
            rows={1}
            placeholder={busy ? "Searching the directory…" : "e.g. Somewhere to get a prescription filled tonight in Riverside"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            disabled={busy}
            aria-label="Your request"
          />
          <button type="button" className="btn btn-primary composer-send" onClick={submit} disabled={busy || !draft.trim()} aria-label="Send">
            <SendHorizontal size={16} />
          </button>
        </div>
        <span className="composer-hint">
          <ShieldAlert size={12} style={{ flexShrink: 0 }} />
          Care Directory points you to services; it does not give medical advice. In an emergency call 999.
        </span>
      </div>
    </section>
  );
}
