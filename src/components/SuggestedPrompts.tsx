import { Clock, HeartPulse, Scissors, Stethoscope } from "lucide-react";
import type { ReactNode } from "react";

export const SUGGESTED_PROMPTS: Array<{ text: string; icon: ReactNode }> = [
  { text: "I need a pharmacy open late tonight", icon: <Clock size={13} /> },
  { text: "Which dentists are taking NHS patients?", icon: <Stethoscope size={13} /> },
  { text: "I've cut my hand and it won't stop bleeding", icon: <Scissors size={13} /> },
  { text: "Is there a walk-in sexual health clinic this week?", icon: <HeartPulse size={13} /> },
];

export function SuggestedPrompts({ onPick, disabled }: { onPick: (text: string) => void; disabled?: boolean }) {
  return (
    <div className="suggestions">
      {SUGGESTED_PROMPTS.map((p) => (
        <button key={p.text} type="button" className="suggestion" onClick={() => onPick(p.text)} disabled={disabled}>
          {p.icon}
          {p.text}
        </button>
      ))}
    </div>
  );
}
