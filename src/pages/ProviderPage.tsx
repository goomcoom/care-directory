import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Accessibility, ArrowLeft, Footprints, HeartHandshake, MapPin, MessageSquareText, Phone } from "lucide-react";
import { CATEGORY_BY_ID, DISTRICT_BY_ID, PROVIDER_BY_ID, PROVIDERS } from "../../shared/directory";
import { localClock } from "../../shared/search";
import { AppShell } from "../components/AppShell";
import { CategoryPill, OpenStatus } from "../components/Chips";
import { Panel } from "../components/Panel";
import { ProviderCard } from "../components/ProviderCard";
import { TownMap } from "../components/TownMap";
import { dayName, formatDay } from "../format";

export function ProviderPage() {
  const { providerId = "" } = useParams();
  const provider = PROVIDER_BY_ID[providerId];
  const [now] = useState(() => new Date());
  const navigate = useNavigate();
  if (!provider) return <Navigate to="/directory" replace />;

  const district = DISTRICT_BY_ID[provider.district];
  const category = CATEGORY_BY_ID[provider.category];
  const today = localClock(now).day;
  const nearby = PROVIDERS.filter((p) => p.district === provider.district && p.id !== provider.id).slice(0, 4);

  return (
    <AppShell crumbs={[{ label: district.name, to: `/directory?district=${district.id}` }, { label: provider.name }]}>
      <div className="page-head">
        <div className="stack" style={{ gap: 8 }}>
          <Link to="/directory" className="hint row" style={{ gap: 4 }}>
            <ArrowLeft size={12} /> Back to the directory
          </Link>
          <h1 className="page-title row" style={{ gap: 10 }}>
            {provider.name}
            <CategoryPill category={provider.category} />
          </h1>
          <p className="page-sub row" style={{ gap: 6 }}>
            <MapPin size={13} />
            {district.name} · {district.blurb}
          </p>
        </div>
        <Link to="/find" className="btn btn-primary">
          <MessageSquareText size={14} />
          Ask the assistant
        </Link>
      </div>

      <div className="grid-2">
        <div className="stack">
          <section className="card" style={{ padding: "18px 20px" }}>
            <div className="stack" style={{ gap: 14 }}>
              <p className="prose">{provider.blurb}</p>
              <div className="facts">
                <div className="fact">
                  <span className="fact-label">Status</span>
                  <span className="fact-value">
                    <OpenStatus provider={provider} now={now} />
                  </span>
                </div>
                <div className="fact">
                  <span className="fact-label">Funding</span>
                  <span className="fact-value">
                    <HeartHandshake size={13} /> {provider.nhs ? "NHS" : "Private"}
                  </span>
                </div>
                <div className="fact">
                  <span className="fact-label">Access</span>
                  <span className="fact-value">
                    <Footprints size={13} /> {provider.walkIn ? "Walk-in" : "By appointment"}
                  </span>
                </div>
                <div className="fact">
                  <span className="fact-label">Step-free</span>
                  <span className="fact-value">
                    <Accessibility size={13} /> {provider.accessible ? "Yes" : "No"}
                  </span>
                </div>
                <div className="fact">
                  <span className="fact-label">Phone</span>
                  <span className="fact-value num">
                    <Phone size={13} /> {provider.phone}
                  </span>
                </div>
              </div>
              <div className="provider-tags">
                {provider.tags.map((t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <Panel title="Opening hours" hint={`Times in the town's local time; today is ${dayName(today)}.`}>
            <table className="hours-table">
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <tr key={d} className={d === today ? "is-today" : ""}>
                    <td>{dayName(d)}</td>
                    <td className="num">{formatDay(provider.hours[d]!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {nearby.length > 0 && (
            <section className="stack" style={{ gap: 10 }}>
              <span className="section-label">Also in {district.name}</span>
              <div className="provider-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                {nearby.map((p) => (
                  <ProviderCard key={p.id} provider={p} now={now} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="map-side">
          <section className="card map-card">
            <span className="row" style={{ gap: 8, fontWeight: 600 }}>
              <MapPin size={15} />
              {provider.name} · {district.name}
            </span>
            <TownMap highlighted={[provider.id]} onSelect={(id) => navigate(`/directory/${id}`)} />
            <span className="hint">
              {category.label} · schematic position only; {district.name} is a fictional part of a fictional town.
            </span>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
