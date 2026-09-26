import type { ReactNode } from "react";

interface Props {
  title: string;
  icon?: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, icon, hint, action, footer, flush, className, children }: Props) {
  return (
    <section className={`card panel ${className ?? ""}`}>
      <header className="panel-head">
        {icon && <span className="panel-icon">{icon}</span>}
        <div style={{ minWidth: 0 }}>
          <h2 className="panel-title">{title}</h2>
          {hint && <div className="panel-hint">{hint}</div>}
        </div>
        {action && <div className="panel-action">{action}</div>}
      </header>
      <div className={`panel-body ${flush ? "flush" : ""}`}>{children}</div>
      {footer && <footer className="panel-foot">{footer}</footer>}
    </section>
  );
}
