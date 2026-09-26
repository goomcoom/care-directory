import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { DISTRICT_BY_ID } from "../../shared/directory";
import type { Provider } from "../../shared/types";
import { CategoryPill, FacetTags, OpenStatus } from "./Chips";

interface Props {
  provider: Provider;
  now: Date;
  /** The agent's one-line reason; omitted on the directory listing. */
  reason?: string;
  highlighted?: boolean;
  /** Sidebar variant: name, status and a link only. */
  compact?: boolean;
  onShowOnMap?: (id: string) => void;
}

export function ProviderCard({ provider, now, reason, highlighted, compact, onShowOnMap }: Props) {
  if (compact) {
    return (
      <Link to={`/directory/${provider.id}`} className={`card card-link provider provider-compact ${highlighted ? "is-highlighted" : ""}`}>
        <div className="provider-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="provider-name">{provider.name}</h3>
            <span className="provider-where">
              <MapPin size={12} />
              {DISTRICT_BY_ID[provider.district].name}
            </span>
          </div>
          <OpenStatus provider={provider} now={now} />
        </div>
      </Link>
    );
  }

  return (
    <article className={`card provider ${highlighted ? "is-highlighted" : ""}`}>
      <div className="provider-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 className="provider-name">{provider.name}</h3>
          <span className="provider-where">
            <MapPin size={12} />
            {DISTRICT_BY_ID[provider.district].name}
          </span>
        </div>
        <CategoryPill category={provider.category} />
      </div>
      {reason ? <p className="provider-reason">{reason}</p> : <p className="provider-reason">{provider.blurb}</p>}
      <div className="provider-foot">
        <OpenStatus provider={provider} now={now} />
        <FacetTags provider={provider} limit={2} />
        {onShowOnMap ? (
          <button type="button" className="btn btn-sm" onClick={() => onShowOnMap(provider.id)}>
            <MapPin size={12} />
            Map
          </button>
        ) : null}
        <Link to={`/directory/${provider.id}`} className="btn btn-sm" style={{ marginLeft: onShowOnMap ? 0 : "auto" }}>
          Details
          <ArrowUpRight size={12} />
        </Link>
      </div>
    </article>
  );
}
