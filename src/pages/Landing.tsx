import { Link } from "react-router-dom";
import {
  ArrowRight,
  Compass,
  FlaskConical,
  ListTree,
  MapPinned,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CATEGORIES, DISTRICTS, PROVIDERS, TOWN } from "../../shared/directory";
import { AppShell } from "../components/AppShell";

export function Landing() {
  return (
    <AppShell>
      <section className="hero">
        <span className="demo-pill">
          <FlaskConical size={13} />
          Demo only · fictional town and providers · not medical advice
        </span>
        <h1 className="hero-title">Say what you need. Get pointed to the right door.</h1>
        <p className="hero-lead">
          Care Directory is a prototype exploring how an AI assistant can help people find local health services: a
          pharmacy that is still open, a dentist taking NHS patients, somewhere to be seen for a cut. You describe the
          need in your own words; the assistant searches the directory for {TOWN} and recommends where to go. It sells
          nothing and books nothing.
        </p>
        <div className="hero-actions">
          <Link to="/find" className="btn btn-primary btn-lg">
            Ask the assistant
            <ArrowRight size={15} />
          </Link>
          <Link to="/directory" className="btn btn-lg">
            <ListTree size={15} />
            Browse the directory
          </Link>
          <span className="hint">
            {PROVIDERS.length} providers · {CATEGORIES.length} kinds of service · {DISTRICTS.length} districts
          </span>
        </div>
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <span className="section-label">The goal</span>
        <div className="feature-grid">
          <article className="card feature">
            <span className="panel-icon feature-icon">
              <MessageSquareText size={17} />
            </span>
            <h2 className="feature-title">Plain words, not filters</h2>
            <p className="feature-body">
              "I need my prescription tonight" already says the category, the urgency and the time. The assistant works
              those out rather than making you pick them from menus.
            </p>
          </article>
          <article className="card feature">
            <span className="panel-icon feature-icon">
              <Search size={17} />
            </span>
            <h2 className="feature-title">Grounded in a real directory</h2>
            <p className="feature-body">
              The assistant only recommends what its search of the directory returns, with the opening hours and access
              details to back it up. If it needs to know where you are, it asks.
            </p>
          </article>
          <article className="card feature">
            <span className="panel-icon feature-icon">
              <ShieldCheck size={17} />
            </span>
            <h2 className="feature-title">Routing, never advice</h2>
            <p className="feature-body">
              It never diagnoses or suggests treatment. If what you describe might be an emergency, it says to call 999
              first, then still shows the urgent services.
            </p>
          </article>
        </div>
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <span className="section-label">How it works</span>
        <div className="card">
          <ol className="flow">
            <li className="flow-step">
              <span className="flow-num">1</span>
              <div>
                <h3 className="flow-title">
                  <MessageSquareText size={15} /> Describe what you need
                </h3>
                <p className="flow-body">
                  Type it as you would say it to a person at a desk. Mention the part of town if you know it; the
                  assistant will ask if it matters.
                </p>
              </div>
              <span className="flow-tag">
                <Sparkles size={12} /> Understands the request
              </span>
            </li>
            <li className="flow-step">
              <span className="flow-num">2</span>
              <div>
                <h3 className="flow-title">
                  <Search size={15} /> The assistant searches the directory
                </h3>
                <p className="flow-body">
                  It calls a search tool over the directory, filtering by service, area, opening hours, NHS or private,
                  walk-in and step-free access. You can watch each search as it happens.
                </p>
              </div>
              <span className="flow-tag">
                <Compass size={12} /> Tool use
              </span>
            </li>
            <li className="flow-step">
              <span className="flow-num">3</span>
              <div>
                <h3 className="flow-title">
                  <MapPinned size={15} /> You get directed, not sold to
                </h3>
                <p className="flow-body">
                  Up to four recommendations with a reason for each, highlighted on the town map, with hours, phone and
                  access details one click away.
                </p>
              </div>
              <span className="flow-tag">
                <MapPinned size={12} /> Recommendations
              </span>
            </li>
          </ol>
        </div>
      </section>

      <section className="card disclaimer">
        <FlaskConical size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <p>
          This is a prototype built to explore the idea. {TOWN}, its districts and every provider in it are fictional
          placeholders; nothing here refers to a real business or place. The assistant routes people to services and
          never gives medical advice. It is not a medical device and has not been assessed for clinical use.
        </p>
      </section>
    </AppShell>
  );
}
