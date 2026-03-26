import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSellerDashboardViewModel } from "../../features/dashboard/dashboardViewModels";
import { getSellerDashboardSnapshot } from "../../services/dashboardService";

export default function SellerDashboardPage() {
  const vm = getSellerDashboardViewModel(getSellerDashboardSnapshot());
  const activeLodgings = vm.lodgingRows.filter((item) => item.status === "ACTIVE").length;
  const inactiveLodgings = vm.lodgingRows.length - activeLodgings;
  const activeRatio = Math.round((activeLodgings / Math.max(vm.lodgingRows.length, 1)) * 100);

  return (
    <DashboardLayout role="seller">
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

      {/* ── Main Grid: Reservations + Lodging ── */}
      <div className="dash-grid-two">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>체크인과 결제 확인</h2>
              <p>예약 · 결제</p>
            </div>
          </div>
          <div className="dash-queue-list">
            {vm.reservationRows.map((item) => (
              <div key={item.no} className="dash-queue-item">
                <span className="dash-queue-kind">{item.no}</span>
                <div className="dash-queue-main">
                  <strong>{item.guest}</strong>
                  <p>{item.detail}</p>
                </div>
                <strong className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</strong>
                <Link className="dash-queue-action" to={item.to}>열기</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>노출 상태와 가동 현황</h2>
              <p>운영 숙소</p>
            </div>
          </div>
          <div className="dash-summary-strip">
            <div className="dash-summary-item">
              <span>노출 중</span>
              <strong>{activeLodgings}곳</strong>
              <div className="dash-track">
                <div className="dash-fill" style={{ width: `${activeRatio}%` }} />
              </div>
            </div>
            <div className="dash-summary-item">
              <span>정비 필요</span>
              <strong>{inactiveLodgings}곳</strong>
              <div className="dash-track">
                <div className="dash-fill is-sand" style={{ width: `${100 - activeRatio}%` }} />
              </div>
            </div>
          </div>
          <div className="dash-lodging-list">
            {vm.lodgingRows.map((item) => (
              <article key={`${item.region}-${item.name}`} className="dash-lodging-card">
                <div className="dash-lodging-main">
                  <span>{item.region}</span>
                  <strong>{item.name}</strong>
                  <p>{item.detail}</p>
                </div>
                <div className="dash-lodging-side">
                  <strong className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</strong>
                  <div className="dash-lodging-occ">
                    <span>점유율</span>
                    <strong>{item.occupancy}</strong>
                  </div>
                  <div className="dash-track">
                    <div className="dash-fill" style={{ width: item.occupancy }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* ── Secondary: Trends + Checklist ── */}
      <div className="dash-grid-two">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>예약 전환과 체크인</h2>
              <p>주간 흐름</p>
            </div>
          </div>
          <div className="dash-trend-list">
            {vm.trends.map((item) => (
              <div key={item.label} className="dash-trend-row">
                <div className="dash-trend-head">
                  <strong>{item.label}</strong>
                  <span>{item.metric}</span>
                </div>
                <div className="dash-track">
                  <div className="dash-fill" style={{ width: item.fill }} />
                </div>
                <p className="dash-trend-meta">{item.meta}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>오늘 확인 사항</h2>
              <p>운영 체크</p>
            </div>
          </div>
          <div className="dash-checklist">
            {vm.checklist.map((item) => (
              <div key={item} className="dash-check-item">
                <span className="dash-check-dot" />
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
