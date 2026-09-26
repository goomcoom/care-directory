import { AlertTriangle, Sparkles } from "lucide-react";
import { DISTRICTS, PROVIDER_BY_ID, TOWN } from "../../shared/directory";
import type { ChatMessage } from "../../shared/types";
import { formatTime } from "../format";
import { ProviderCard } from "./ProviderCard";

interface Props {
  message: ChatMessage;
  now: Date;
  highlighted: string[];
  /** Only the latest assistant message offers follow-up chips. */
  isLatest: boolean;
  busy: boolean;
  onSend: (text: string) => void;
  onShowOnMap: (id: string) => void;
}

const ASKS_DISTRICT = /part of|where(abouts)? (are|in)|which (area|district)/i;

export function MessageBubble({ message, now, highlighted, isLatest, busy, onSend, onShowOnMap }: Props) {
  if (message.role === "user") {
    return (
      <div className="msg msg-user fade-in">
        <div className="bubble">{message.text}</div>
        <div className="msg-meta">
          <span className="num">{formatTime(message.at)}</span>
        </div>
      </div>
    );
  }

  const recs = message.recommendations.map((r) => ({ ...r, provider: PROVIDER_BY_ID[r.providerId] })).filter((r) => r.provider);
  const wantsDistrict = message.followUp ? ASKS_DISTRICT.test(message.followUp) : false;

  return (
    <div className="msg msg-assistant fade-in">
      {message.safety && (
        <div className="notice notice-error" role="alert" style={{ maxWidth: "88%" }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{message.safety}</span>
        </div>
      )}
      <div className="bubble">{message.text}</div>
      {recs.length > 0 && (
        <div className={`recs ${recs.length === 1 ? "single" : ""}`}>
          {recs.map((r) => (
            <ProviderCard
              key={r.providerId}
              provider={r.provider!}
              now={now}
              reason={r.reason}
              highlighted={isLatest && highlighted.includes(r.providerId)}
              onShowOnMap={onShowOnMap}
            />
          ))}
        </div>
      )}
      {message.followUp && (
        <div className="followup">
          <span className="followup-q">{message.followUp}</span>
          {isLatest && wantsDistrict && (
            <div className="followup-chips">
              {DISTRICTS.map((d) => (
                <button key={d.id} type="button" className="chip" disabled={busy} onClick={() => onSend(`I'm in ${d.name}`)}>
                  {d.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="msg-meta">
        <Sparkles size={11} />
        <span>
          {TOWN} directory · {message.steps.length} search{message.steps.length === 1 ? "" : "es"}
        </span>
        <span>·</span>
        <span className="num">{formatTime(message.at)}</span>
      </div>
    </div>
  );
}
