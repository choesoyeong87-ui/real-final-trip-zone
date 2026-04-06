import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { getSellerDashboardViewModel } from "../../features/dashboard/dashboardViewModels";
import { getSellerDashboardSnapshot } from "../../services/dashboardService";

const SELLER_DASHBOARD_CACHE_KEY = "tripzone-seller-dashboard-snapshot-v2";

function readSellerDashboardCache() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(SELLER_DASHBOARD_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function SellerDashboardPage() {
  const cachedSnapshot = readSellerDashboardCache();
  const [snapshot, setSnapshot] = useState(cachedSnapshot ?? {
    reservations: [],
    lodgings: [],
    metrics: [],
    sellerTasks: [],
    salesSummary: {
      summaryCards: [],
      monthlySales: [],
      lodgingTypeRatios: [],
      lodgingTypeSales: [],
    },
  });
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(!cachedSnapshot);
  const vm = getSellerDashboardViewModel(snapshot);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        if (!cachedSnapshot) {
          setIsLoading(true);
        }
        const nextSnapshot = await getSellerDashboardSnapshot();
        if (cancelled) return;
        setSnapshot(nextSnapshot);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(SELLER_DASHBOARD_CACHE_KEY, JSON.stringify(nextSnapshot));
        }
        setNotice("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load seller dashboard snapshot.", error);
        setNotice("판매자 대시보드 데이터를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeLodgings = vm.lodgingRows.filter((item) => item.status === "ACTIVE").length;
  const inactiveLodgings = vm.lodgingRows.length - activeLodgings;
  const waitingInquiries = vm.metrics.find((item) => item.label === "답변 대기 문의")?.value ?? "00";
  const todayCheckIns = vm.metrics.find((item) => item.label === "오늘 체크인")?.value ?? "00";
  const salesSummary = snapshot.salesSummary ?? {
    summaryCards: [],
    monthlySales: [],
    lodgingTypeRatios: [],
    lodgingTypeSales: [],
  };
  const monthlySales = salesSummary.monthlySales.slice(-6);
  const priorityRows = vm.reservationRows.slice(0, 3);
  const maxMonthlySales = Math.max(...monthlySales.map((item) => item.salesAmount), 1);
  const totalLodgingTypeCount = salesSummary.lodgingTypeRatios.reduce((sum, item) => sum + item.lodgingCount, 0);
  const cancellationRisk = salesSummary.summaryCards.find((item) => item.label === "취소비율")?.value ?? "0%";
  const kpiRows = [
    { label: "체크인 예정", value: `${todayCheckIns}건`, note: "오늘 도착 예약 기준", tone: "normal" },
    { label: "운영 중 숙소", value: `${activeLodgings}곳`, note: "현재 노출 상태 기준", tone: "normal" },
    { label: "청소/정비 필요 숙소", value: `${inactiveLodgings}곳`, note: "비활성 숙소 우선 점검", tone: inactiveLodgings > 0 ? "warning" : "normal" },
    { label: "취소/노쇼 위험", value: cancellationRisk, note: "최근 집계 취소 비율", tone: cancellationRisk === "0%" ? "normal" : "danger" },
  ];
  const operationRows = [
    {
      title: "체크인 예정 예약",
      value: `${todayCheckIns}건`,
      note: "프런트 응대와 객실 준비를 먼저 확인",
      tone: Number(todayCheckIns) > 0 ? "normal" : "muted",
    },
    {
      title: "답변 대기 문의",
      value: `${waitingInquiries}건`,
      note: "체류 중 문의와 입실 전 문의 우선 처리",
      tone: Number(waitingInquiries) > 0 ? "warning" : "normal",
    },
    {
      title: "청소/정비 필요 숙소",
      value: `${inactiveLodgings}곳`,
      note: "노출 중단 숙소 상태 점검 필요",
      tone: inactiveLodgings > 0 ? "danger" : "normal",
    },
  ];

  return (
    <DashboardLayout role="seller">
      <div className="seller-board">
        {isLoading ? <div className="my-empty-inline">판매자 대시보드를 불러오는 중입니다.</div> : null}
        {notice ? <div className="my-empty-inline">{notice}</div> : null}

        <div className="seller-saas-board">
          <div className="saas-header">
            <div className="saas-kpis">
              {kpiRows.map((item) => (
                <div key={item.label} className={`saas-kpi-card tone-${item.tone}`}>
                  <div className="kpi-header">
                    <span className="kpi-label">{item.label}</span>
                    {item.tone !== "normal" && (
                       <span className="kpi-status-dot" aria-label={item.tone} />
                    )}
                  </div>
                  <strong className="kpi-value">{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="saas-bento-middle">
            <section className="saas-bento-panel panel-charts">
              <div className="saas-bento-head">
                <strong>매출 흐름 (최근 6개월)</strong>
              </div>
              <div className="saas-chart">
                {monthlySales.map((item) => (
                  <div key={item.monthLabel} className="chart-bar-wrap">
                    <div className="chart-bar-bg">
                      <div
                        className="chart-bar-fill"
                        style={{ height: `${Math.max((item.salesAmount / maxMonthlySales) * 100, item.salesAmount > 0 ? 8 : 0)}%` }}
                      >
                        <span className="chart-value-float">
                          {item.salesAmount > 0 ? `${Math.round(item.salesAmount / 10000)}만` : "-"}
                        </span>
                      </div>
                    </div>
                    <span className="chart-month-label">{item.monthLabel.slice(5)}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>

          <div className="saas-bento-bottom">
            <section className="saas-bento-panel panel-tasks">
              <div className="saas-bento-head">
                <strong>예약 우선순위</strong>
                <Link to="/seller/reservations" className="saas-link">업무 전체 보기</Link>
              </div>
              <div className="saas-task-list">
                {priorityRows.length ? (
                  priorityRows.map((item) => (
                    <article key={item.no} className={`saas-task-row tone-${item.tone}`}>
                      <div className="task-content">
                        <div className="task-meta">
                          <span className={`task-badge tone-${item.tone}`}>{item.label}</span>
                          <span className="task-risk">{item.riskLabel}</span>
                        </div>
                        <strong>예약 {item.no} · {item.guest}</strong>
                        <p>{item.detail}</p>
                      </div>
                      <Link to={item.to} className="saas-btn-outline">{item.actionLabel}</Link>
                    </article>
                  ))
                ) : (
                  <div className="saas-empty">오늘 우선 확인할 예약이 없습니다.</div>
                )}
              </div>
            </section>

            <section className="saas-bento-alerts">
              <div className="saas-bento-head">
                <strong>피드 알림</strong>
              </div>
              <div className="saas-feed-list">
                {operationRows.map((item) => (
                  <article key={item.title} className={`saas-feed-item tone-${item.tone}`}>
                    <div className="feed-info">
                      <span className="feed-title">{item.title}</span>
                      <p className="feed-note">{item.note}</p>
                    </div>
                    <strong className="feed-val">{item.value}</strong>
                  </article>
                ))}
              </div>
            </section>

            <section className="saas-bento-panel panel-lodgings">
              <div className="saas-bento-head">
                <strong>숙소 상태 점검</strong>
              </div>
              <div className="saas-lodging-list">
                {vm.lodgingRows.slice(0, 4).map((item) => (
                  <article key={`${item.region}-${item.name}`} className={`saas-lodging-row tone-${item.tone}`}>
                    <div className="lodging-content">
                      <strong>{item.name}</strong>
                      <div className="lodging-meta">
                        <span className={`task-badge tone-${item.tone}`}>{item.label}</span>
                        <span>{item.region}</span>
                      </div>
                    </div>
                    <Link to={item.to} className="saas-btn-ghost">{item.actionLabel}</Link>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>



      </div>
    </DashboardLayout>
  );
}
