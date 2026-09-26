import { useEffect, type ReactNode } from "react";
import { MapPinned, X } from "lucide-react";
import { TOWN } from "../../shared/directory";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  hint?: string;
  children: ReactNode;
}

/** Bottom sheet holding the town map on small screens. */
export function MapModal({ open, onClose, title = TOWN, hint, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <span className="row" style={{ gap: 8, fontWeight: 600, minWidth: 0 }}>
            <MapPinned size={15} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</span>
          </span>
          {hint && <span className="hint">{hint}</span>}
          <button type="button" className="btn btn-ghost btn-sm modal-close" onClick={onClose} aria-label="Close map">
            <X size={16} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
