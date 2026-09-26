import { Check, Loader2 } from "lucide-react";
import type { AgentStep } from "../../shared/types";

interface Props {
  steps: AgentStep[];
  /** How many steps have completed; the next one is shown as active. */
  done: number;
  /** Label for the trailing step while the answer is being composed. */
  composing?: boolean;
}

export function AgentSteps({ steps, done, composing = true }: Props) {
  return (
    <div className="agent-steps fade-in" aria-live="polite" aria-busy="true">
      <ol className="steps">
        {steps.map((s, i) => {
          const state = i < done ? "done" : i === done ? "active" : "todo";
          return (
            <li key={s.id} className={`step ${state}`}>
              <span className="step-icon">
                {state === "done" ? <Check size={12} strokeWidth={3} /> : state === "active" ? <Loader2 size={12} className="spin" /> : i + 1}
              </span>
              <span>{s.label}</span>
              {state === "done" && s.detail && <span className="step-detail">{s.detail}</span>}
            </li>
          );
        })}
        {composing && (
          <li className={`step ${done >= steps.length ? "active" : "todo"}`}>
            <span className="step-icon">
              {done >= steps.length ? <Loader2 size={12} className="spin" /> : steps.length + 1}
            </span>
            <span>Writing the reply</span>
          </li>
        )}
      </ol>
    </div>
  );
}
