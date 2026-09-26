import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronRight, FlaskConical, ListTree, MapPinned, MessageSquareText, RotateCcw, Zap } from "lucide-react";
import { useApiMode } from "../api";
import { resetDemoData } from "../store";

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  crumbs?: Crumb[];
  children: ReactNode;
}

export function AppShell({ crumbs = [], children }: Props) {
  const mode = useApiMode();
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="wordmark">
            <span className="wordmark-icon">
              <MapPinned size={16} strokeWidth={2.4} />
            </span>
            Care Directory
          </Link>
          {crumbs.length > 0 && (
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link to="/directory">Directory</Link>
              {crumbs.map((c, i) => (
                <span key={i} className="row" style={{ gap: 6, minWidth: 0 }}>
                  <span className="sep">
                    <ChevronRight size={14} />
                  </span>
                  {c.to ? (
                    <Link to={c.to}>{c.label}</Link>
                  ) : (
                    <span className="current">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <div className="topbar-actions">
            {mode === "simulated" && (
              <span
                className="pill mode-pill mode-simulated"
                title="No Claude API key is configured, so the assistant's replies are simulated from the same directory data. Add ANTHROPIC_API_KEY to .env for live answers."
              >
                <FlaskConical size={12} />
                Simulated AI
              </span>
            )}
            {mode === "live" && (
              <span className="pill mode-pill mode-live" title="Connected to the Claude API">
                <Zap size={12} />
                Live AI
              </span>
            )}
            <NavLink to="/find" className="btn btn-ghost btn-sm">
              <MessageSquareText size={14} />
              <span>Find</span>
            </NavLink>
            <NavLink to="/directory" className="btn btn-ghost btn-sm">
              <ListTree size={14} />
              <span>Directory</span>
            </NavLink>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                if (window.confirm("Clear the conversation and start again?")) {
                  resetDemoData();
                }
              }}
              title="Clear the conversation"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
