import { CATEGORY_BY_ID } from "../../shared/directory";
import type { CategoryId, Provider } from "../../shared/types";
import { openStatus } from "../format";

export function CategoryPill({ category }: { category: CategoryId }) {
  return <span className={`cat cat-${category}`}>{CATEGORY_BY_ID[category].label}</span>;
}

export function OpenStatus({ provider, now }: { provider: Provider; now: Date }) {
  const status = openStatus(provider, now);
  return (
    <span className={`open-status ${status.open ? "is-open" : ""}`}>
      <span className="pill-dot" />
      {status.label}
    </span>
  );
}

export function FacetTags({ provider, limit = 3 }: { provider: Provider; limit?: number }) {
  const facets = [
    provider.nhs ? "NHS" : "Private",
    provider.walkIn ? "Walk-in" : "Appointment",
    provider.accessible ? "Step-free" : null,
  ].filter((f): f is string => Boolean(f));
  return (
    <span className="provider-tags">
      {facets.slice(0, limit).map((f) => (
        <span key={f} className="tag">
          {f}
        </span>
      ))}
    </span>
  );
}
