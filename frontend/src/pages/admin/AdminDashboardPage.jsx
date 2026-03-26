import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getAdminDashboardViewModel } from "../../features/dashboard/dashboardViewModels";
import { getAdminDashboardSnapshot } from "../../services/dashboardService";

export default function AdminDashboardPage() {
  const vm = getAdminDashboardViewModel(getAdminDashboardSnapshot());

  return (
    <DashboardLayout role="admin">
      {/* ── Page Header ── */}
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">{vm.header.eyebrow}</p>
          <h1>{vm.header.title}</h1>
          <p>{vm.header.description}</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="dash-stat-grid">
        {vm.metrics.map((item) => (
          <article key={item.label} className="dash-stat-card">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>

      {/* ── Main Grid: Queue + Logs ── */}
      <div className="dash-grid-two">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>우선 처리 큐</h2>
              <p>승인, 문의, 제재 건을 빠르게 확인</p>
            </div>
          </div>
          <div className="dash-queue-list">
            {vm.watchRows.map((item) => (
              <div key={`${item.kind}-${item.title}`} className="dash-queue-item">
                <span className="dash-queue-kind">{item.kind}</span>
                <div className="dash-queue-main">
                  <strong>{item.title}</strong>
                  <p>{item.meta}</p>
                </div>
                <span className={`table-code code-${item.status.toLowerCase()}`}>{item.status}</span>
                <Link className="dash-queue-action" to={item.to}>열기</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>관리 로그</h2>
              <p>최근 운영 조치 기록</p>
            </div>
          </div>
          <div className="dash-timeline">
            {vm.logs.map((item) => (
              <div key={`${item.title}-${item.time}`} className="dash-timeline-item">
                <div className="dash-timeline-main">
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>
                <span className="dash-timeline-target">{item.target}</span>
                <time className="dash-timeline-time">{item.time}</time>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Secondary Grid ── */}
      <div className="dash-grid-two">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>예약 현황</h2>
            </div>
          </div>
          <div className="dash-ratio-list">
            {vm.reservationMix.map((item) => (
              <div key={item.label} className="dash-ratio-row">
                <div className="dash-ratio-head">
                  <strong>{item.label}</strong>
                  <span>{item.ratio}</span>
                </div>
                <div className="dash-track">
                  <div className={`dash-fill${item.tone === "sand" ? " is-sand" : ""}`} style={{ width: item.fill }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>주의 회원</h2>
            </div>
          </div>
          <div className="dash-watch-list">
            {vm.attentionUsers.map((item) => (
              <div key={item.email} className="dash-watch-item">
                <div className="dash-watch-meta">
                  <span className={`table-code code-${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
                <strong>{item.name}</strong>
                <p>{item.email}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
