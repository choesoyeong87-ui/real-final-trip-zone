import { Link } from "react-router-dom";

function getFocusRowKey(item, index) {
  return item.key ?? `${item.title ?? item.label ?? "focus"}-${item.to}-${index}`;
}

function Sparkline({ values, filled = true }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 88, H = 36;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - ((v - min) / range) * (H - 6) - 3,
  ]);
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area =
    `M${pts[0][0]},${H} ` +
    pts.map(([x, y]) => `L${x},${y}`).join(" ") +
    ` L${pts[pts.length - 1][0]},${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dash-sparkline" preserveAspectRatio="none" aria-hidden="true">
      {filled && <path d={area} className="dash-sparkline-fill" />}
      <polyline points={polyline} className="dash-sparkline-line" strokeWidth="1.8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function DonutGauge({ value, max = 100 }) {
  const r = 13, cx = 16, cy = 16;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const filled = circumference * pct;
  const empty = circumference * (1 - pct);

  return (
    <svg viewBox="0 0 32 32" className="dash-gauge" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" className="dash-gauge-track" strokeWidth="3.5" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        className="dash-gauge-fill"
        strokeWidth="3.5"
        strokeDasharray={`${filled} ${empty}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DashboardHero({
  eyebrow,
  title,
  description,
  links,
  facts,
  spotlight,
  insightTitle,
  insightRows,
  ariaLabel,
  compact = false,
}) {
  return (
    <header className={`opsdash-hero${compact ? " is-compact" : ""}`}>
      <div className="opsdash-hero-main">
        <div className="opsdash-hero-copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
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
            {insightRows.map((item, index) => (
              <Link key={getFocusRowKey(item, index)} to={item.to} className="opsdash-focus-row">
                <div className="opsdash-focus-main">
                  <div className="opsdash-focus-meta">
                    {item.label ? <span>{item.label}</span> : null}
                    {item.status ? <strong className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</strong> : null}
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
                <span className="opsdash-row-arrow">{item.actionLabel ?? "보기"}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </header>
  );
}

export function DashboardMetricStrip({ items, label, className = "" }) {
  return (
    <section className={`opsdash-metric-strip${className ? ` ${className}` : ""}`} aria-label={label}>
      {items.map((item) => (
        <article
          key={item.label}
          className={`opsdash-metric-card${item.alert ? " is-alert" : ""}${item.sparkline ? " has-sparkline" : ""}${item.gauge != null ? " has-gauge" : ""}${!item.sparkline && item.gauge == null ? " is-plain" : ""}`}
        >
          <div className="opsdash-metric-top">
            <span className="opsdash-metric-label">{item.label}</span>
            {item.trend && (
              <span className={`opsdash-metric-trend ${item.trendUp ? "is-up" : "is-down"}`}>
                {item.trendUp ? "↑" : "↓"} {item.trend}
              </span>
            )}
          </div>
          <strong className="opsdash-metric-value">{item.value}</strong>
          {item.sparkline ? (
            <div className="opsdash-metric-chart">
              <Sparkline values={item.sparkline} filled />
            </div>
          ) : item.gauge != null ? (
            <div className="opsdash-metric-chart opsdash-metric-gauge-wrap">
              <DonutGauge value={item.gauge} max={item.gaugeMax ?? 100} />
            </div>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export function DashboardFocusList({ rows, compact = false }) {
  return (
    <div className={`opsdash-focus-list${compact ? " is-compact" : ""}`}>
      {rows.map((item, index) => (
        <Link key={getFocusRowKey(item, index)} to={item.to} className={`opsdash-focus-row${compact ? " is-compact" : ""}`}>
          <div className="opsdash-focus-main">
            <div className="opsdash-focus-meta">
              {item.label ? <span>{item.label}</span> : null}
              {item.status ? <strong className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</strong> : null}
            </div>
            <strong>{item.title}</strong>
            <p>{item.meta}</p>
          </div>
          <span className="opsdash-row-arrow">{item.actionLabel ?? "보기"}</span>
        </Link>
      ))}
    </div>
  );
}

export function DashboardPanel({ eyebrow, title, action, tone = "default", children, className = "" }) {
  const classes = ["opsdash-panel", tone !== "default" ? `is-${tone}` : "", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <div className="opsdash-section-head">
        <div>
          {eyebrow ? <span>{eyebrow}</span> : null}
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
        <div key={`${item.title}-${item.time}`} className={`opsdash-log-row is-${item.type ?? "default"}`}>
          <span className="opsdash-log-dot" aria-hidden="true" />
          <div className="opsdash-log-main">
            <strong>{item.title}</strong>
            <p>{item.subtitle} · {item.target}</p>
          </div>
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

export function DashboardStayList({ rows }) {
  return (
    <div className="opsdash-stay-list">
      {rows.map((item) => (
        <article key={`${item.name}-${item.region}`} className="opsdash-stay-row">
          <div className="opsdash-stay-main">
            <span>{item.region}</span>
            <strong>{item.name}</strong>
            <div className="opsdash-stay-meta">
              <span>{item.roomSummary}</span>
              <span>{item.inquirySummary}</span>
            </div>
          </div>
          <div className="opsdash-stay-side">
            <strong className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</strong>
            <div className="opsdash-stay-occupancy">
              <span>가동률</span>
              <strong>{item.occupancy}</strong>
            </div>
            <div className="opsdash-track">
              <div className="opsdash-fill" style={{ width: item.occupancy }} />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function DashboardWatchList({ rows, compact = false }) {
  return (
    <div className={`opsdash-watch-list${compact ? " is-compact" : ""}`}>
      {rows.map((item) => (
        <div key={item.email} className={`opsdash-watch-row${compact ? " is-compact" : ""}`}>
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

export function DashboardLinkList({ items, compact = false }) {
  return (
    <div className={`opsdash-link-list${compact ? " is-compact" : ""}`}>
      {items.map((item) => (
        <Link key={item.to} className={`opsdash-link-row${item.accent ? ` has-icon` : ""}${compact ? " is-compact" : ""}`} to={item.to}>
          {item.icon && (
            <span className={`opsdash-link-icon is-${item.accent}`} aria-hidden="true">{item.icon}</span>
          )}
          <div className="opsdash-link-copy">
            <strong>{item.title}</strong>
            <span>{item.subtitle}</span>
          </div>
          <span className="opsdash-link-arrow" aria-hidden="true">→</span>
        </Link>
      ))}
    </div>
  );
}
