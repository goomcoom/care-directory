import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Accessibility, Clock, Footprints, HeartHandshake, Map, MapPinned, X } from "lucide-react";
import { CATEGORIES, DISTRICTS, TOWN } from "../../shared/directory";
import type { SearchInput } from "../../shared/schemas";
import { searchProviders } from "../../shared/search";
import { CATEGORY_IDS, DISTRICT_IDS, type CategoryId, type DistrictId } from "../../shared/types";
import { AppShell } from "../components/AppShell";
import { MapModal } from "../components/MapModal";
import { ProviderCard } from "../components/ProviderCard";
import { TownMap } from "../components/TownMap";
import { useIsMobile } from "../hooks";

const isCategory = (v: string | null): v is CategoryId => CATEGORY_IDS.includes(v as CategoryId);
const isDistrict = (v: string | null): v is DistrictId => DISTRICT_IDS.includes(v as DistrictId);

export function DirectoryPage() {
  const [params, setParams] = useSearchParams();
  const [now] = useState(() => new Date());
  const [mapOpen, setMapOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const input: SearchInput = {
    category: isCategory(params.get("category")) ? (params.get("category") as CategoryId) : undefined,
    district: isDistrict(params.get("district")) ? (params.get("district") as DistrictId) : undefined,
    openNow: params.get("open") === "1" || undefined,
    nhs: params.get("nhs") === "1" || undefined,
    walkIn: params.get("walkin") === "1" || undefined,
    accessible: params.get("accessible") === "1" || undefined,
  };

  const result = useMemo(() => searchProviders(input, now, 100), [params, now]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(params);
    if (value === undefined) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const toggle = (key: string, on: boolean | undefined) => set(key, on ? undefined : "1");
  const hasFilters = [...params.keys()].length > 0;

  return (
    <AppShell crumbs={[{ label: "All providers" }]}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Directory</h1>
          <p className="page-sub">
            Every health service in {TOWN}. {result.total} of {searchProviders({}, now, 100).total} shown.
          </p>
        </div>
        {hasFilters && (
          <button type="button" className="btn btn-sm" onClick={() => setParams({}, { replace: true })}>
            <X size={13} />
            Clear filters
          </button>
        )}
      </div>

      <div className="grid-2 directory-grid">
        <div className="stack">
          <div className="card map-bar">
            <MapPinned size={15} style={{ flexShrink: 0, color: "var(--muted)" }} />
            <span className="map-bar-text">
              {input.district ? `Showing ${DISTRICTS.find((d) => d.id === input.district)?.name}` : `All of ${TOWN}`}
            </span>
            <button type="button" className="btn btn-sm" onClick={() => setMapOpen(true)}>
              <Map size={13} />
              Map
            </button>
          </div>
          <section className="card filter-bar">
            <div className="filter-row">
              <span className="filter-label">Service</span>
              <div className="filter-chips">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip ${input.category === c.id ? "is-on" : ""}`}
                    onClick={() => set("category", input.category === c.id ? undefined : c.id)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-row">
              <span className="filter-label">Area</span>
              <div className="filter-chips">
                {DISTRICTS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`chip ${input.district === d.id ? "is-on" : ""}`}
                    onClick={() => set("district", input.district === d.id ? undefined : d.id)}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-row">
              <span className="filter-label">Needs</span>
              <div className="filter-chips">
                <button type="button" className={`chip ${input.openNow ? "is-on" : ""}`} onClick={() => toggle("open", input.openNow)}>
                  <Clock size={12} /> Open now
                </button>
                <button type="button" className={`chip ${input.nhs ? "is-on" : ""}`} onClick={() => toggle("nhs", input.nhs)}>
                  <HeartHandshake size={12} /> NHS
                </button>
                <button type="button" className={`chip ${input.walkIn ? "is-on" : ""}`} onClick={() => toggle("walkin", input.walkIn)}>
                  <Footprints size={12} /> Walk-in
                </button>
                <button
                  type="button"
                  className={`chip ${input.accessible ? "is-on" : ""}`}
                  onClick={() => toggle("accessible", input.accessible)}
                >
                  <Accessibility size={12} /> Step-free
                </button>
              </div>
            </div>
          </section>

          {result.matches.length === 0 ? (
            <div className="card" style={{ padding: 24 }}>
              <p className="empty">No providers match those filters. Try removing one.</p>
            </div>
          ) : (
            <div className="provider-grid">
              {result.matches.map((p) => (
                <ProviderCard key={p.id} provider={p} now={now} />
              ))}
            </div>
          )}
        </div>

        <aside className="map-side">
          <section className="card map-card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="row" style={{ gap: 8, fontWeight: 600 }}>
                <MapPinned size={15} />
                {TOWN}
              </span>
              <span className="hint">Click an area to filter</span>
            </div>
            <TownMap
              visible={result.matches.map((p) => p.id)}
              activeDistrict={input.district}
              onSelect={(id) => navigate(`/directory/${id}`)}
              onDistrict={(d) => set("district", input.district === d ? undefined : d)}
            />
          </section>
        </aside>
      </div>
      <MapModal open={mapOpen && isMobile} onClose={() => setMapOpen(false)} hint="Tap an area to filter">
        <TownMap
          visible={result.matches.map((p) => p.id)}
          activeDistrict={input.district}
          onSelect={(id) => {
            setMapOpen(false);
            navigate(`/directory/${id}`);
          }}
          onDistrict={(d) => {
            set("district", input.district === d ? undefined : d);
            setMapOpen(false);
          }}
        />
        <span className="hint">
          {result.total} provider{result.total === 1 ? "" : "s"} match the current filters. Tap a dot for details.
        </span>
      </MapModal>
    </AppShell>
  );
}
