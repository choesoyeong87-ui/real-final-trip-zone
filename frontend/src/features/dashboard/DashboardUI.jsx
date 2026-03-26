import { Link } from "react-router-dom";

export function DashboardHero({ eyebrow, title, description, links, facts, spotlight, insightTitle, insightRows, ariaLabel }) {
  return (
    <header className="opsdash-hero">
      <div className="opsdash-hero-main">
        <div className="opsdash-hero-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <nav className="opsdash-hero-nav" aria-label={ariaLabel}>
          {links.map((item) => (
            <Link key={item.to} to={item.to} className="opsdash-hero-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        {facts?.length ? (
          <div className="opsdash-hero-facts">
            {facts.map((item) => (
              <article key={item.label} className="opsdash-hero-fact">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <aside className="opsdash-hero-aside">
        <div className="opsdash-spotlight">
          <span>{spotlight.label}</span>
          <strong>{spotlight.value}</strong>
          <p>{spotlight.note}</p>
        </div>

        <div className="opsdash-aside-card">
          <div className="opsdash-block-head">
            <span>{insightTitle}</span>
          </div>
          <div className="opsdash-focus-list">
            {insightRows.map((item) => (
              <Link key={`${item.title}-${item.to}`} to={item.to} className="opsdash-focus-row">
                <div className="opsdash-focus-main">
                  <div className="opsdash-focus-meta">
                    <span>{item.label}</span>
                    {item.status ? <strong className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</strong> : null}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
                <span className="opsdash-row-arrow">보기</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </header>
  );
}

export function DashboardMetricStrip({ items, label }) {
  return (
    <section className="opsdash-metric-strip" aria-label={label}>
      {items.map((item) => (
        <article key={item.label} className="opsdash-metric-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}

export function DashboardPanel({ eyebrow, title, action, tone = "default", children, className = "" }) {
  const classes = ["opsdash-panel", tone !== "default" ? `is-${tone}` : "", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <div className="opsdash-section-head">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {action ? (
          <Link className="opsdash-inline-action" to={action.to}>
            {action.label}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function DashboardLogList({ rows }) {
  return (
    <div className="opsdash-log-list">
      {rows.map((item) => (
        <div key={`${item.title}-${item.time}`} className="opsdash-log-row">
          <div className="opsdash-log-main">
            <strong>{item.title}</strong>
            <p>{item.subtitle}</p>
          </div>
          <span className="opsdash-log-target">{item.target}</span>
          <time>{item.time}</time>
        </div>
      ))}
    </div>
  );
}

export function DashboardTrendList({ rows }) {
  return (
    <div className="opsdash-trend-list">
      {rows.map((item) => (
        <div key={item.label} className="opsdash-trend-row">
          <div className="opsdash-trend-head">
            <strong>{item.label}</strong>
            <span>{item.metric}</span>
          </div>
          <div className="opsdash-track">
            <div className="opsdash-fill" style={{ width: item.fill }} />
          </div>
          <p>{item.meta}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardMixList({ rows }) {
  return (
    <div className="opsdash-mix-list">
      {rows.map((item) => (
        <div key={item.label} className={`opsdash-mix-row is-${item.tone ?? "mint"}`}>
          <div className="opsdash-mix-head">
            <strong>{item.label}</strong>
            <span>{item.ratio}</span>
          </div>
          <div className="opsdash-track">
            <div className="opsdash-fill" style={{ width: item.fill }} />
          </div>
          <p>{item.count}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardPerformanceList({ rows }) {
  return (
    <div className="opsdash-performance-list">
      {rows.map((item, index) => (
        <div key={item.label} className="opsdash-performance-row">
          <span className="opsdash-rank">{String(index + 1).padStart(2, "0")}</span>
          <div className="opsdash-performance-main">
            <strong>{item.label}</strong>
            <p>{item.metric}</p>
          </div>
          <div className="opsdash-performance-side">
            <strong>{item.revenue}</strong>
            <div className="opsdash-track">
              <div className="opsdash-fill" style={{ width: item.fill }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardWatchList({ rows }) {
  return (
    <div className="opsdash-watch-list">
      {rows.map((item) => (
        <div key={item.email} className="opsdash-watch-row">
          <div className="opsdash-focus-meta">
            <strong className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</strong>
            <span>{item.role}</span>
          </div>
          <strong>{item.name}</strong>
          <p>{item.email}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardFactGrid({ items }) {
  return (
    <div className="opsdash-fact-grid">
      {items.map((item) => (
        <div key={item.label} className="opsdash-fact-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function DashboardChecklist({ items }) {
  return (
    <div className="opsdash-check-list">
      {items.map((item) => (
        <div key={item} className="opsdash-check-row">
          <span />
          <strong>{item}</strong>
        </div>
      ))}
    </div>
  );
}

export function DashboardLinkList({ items }) {
  return (
    <div className="opsdash-link-list">
      {items.map((item) => (
        <Link key={item.to} className="opsdash-link-row" to={item.to}>
          <strong>{item.title}</strong>
          <span>{item.subtitle}</span>
        </Link>
      ))}
    </div>
  );
}
