import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  DashboardFocusList,
  DashboardLinkList,
  DashboardMetricStrip,
  DashboardPanel,
  DashboardStayList,
  DashboardTrendList,
} from "../../features/dashboard/DashboardUI";
import { getSellerDashboardViewModel } from "../../features/dashboard/dashboardViewModels";
import { getSellerDashboardSnapshot } from "../../services/dashboardService";

export default function SellerDashboardPage() {
  const vm = getSellerDashboardViewModel(getSellerDashboardSnapshot());
  const activeLodgings = vm.lodgingRows.filter((item) => item.status === "ACTIVE").length;
  const inactiveLodgings = vm.lodgingRows.length - activeLodgings;
  const activeRatio = Math.round((activeLodgings / Math.max(vm.lodgingRows.length, 1)) * 100);
  const priorityRows = vm.reservationRows.slice(0, 2).map((item) => ({
    ...item,
    label:
      item.status === "PENDING"
        ? "결제 대기"
        : item.status === "CONFIRMED"
          ? "체크인 예정"
          : "취소 확인",
    meta: `${item.no} · ${item.detail}`,
    actionLabel:
      item.status === "PENDING"
        ? "결제 확인"
        : item.status === "CONFIRMED"
          ? "체크인 준비"
          : "취소 확인",
  }));

  return (
    <DashboardLayout role="seller">
      <div className="opsdash is-seller">
        <div className="seller-top-grid">
          <DashboardPanel
            eyebrow="Today First"
            title="체크인과 결제를 먼저 처리하세요"
            tone="strong"
            className="seller-panel-workboard"
          >
            <div className="opsdash-board-section">
              <div className="opsdash-board-head">
                <strong>체크인과 결제 확인</strong>
                <span>오늘 예약 우선 처리</span>
              </div>
              <DashboardFocusList rows={priorityRows} compact />
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Availability"
            title="노출 상태와 가동 현황"
            className="seller-panel-stays"
          >
            <div className="opsdash-board-section">
              <div className="opsdash-board-head">
                <strong>운영 숙소 상태</strong>
                <span>노출과 정비 상태를 분리해서 본다</span>
              </div>
              <div className="seller-stay-summary">
                <div className="seller-stay-summary-item">
                  <span>노출 중</span>
                  <strong>{activeLodgings}곳</strong>
                  <div className="opsdash-track">
                    <div className="opsdash-fill" style={{ width: `${activeRatio}%` }} />
                  </div>
                </div>
                <div className="seller-stay-summary-item is-sand">
                  <span>정비 필요</span>
                  <strong>{inactiveLodgings}곳</strong>
                  <div className="opsdash-track">
                    <div className="opsdash-fill" style={{ width: `${100 - activeRatio}%` }} />
                  </div>
                </div>
              </div>
              <DashboardStayList rows={vm.lodgingRows.slice(0, 2)} />
            </div>
          </DashboardPanel>
        </div>

        <DashboardMetricStrip items={vm.metrics.slice(1)} label="판매자 핵심 지표" className="seller-metric-strip" />

        <DashboardPanel eyebrow="Operations" title="주간 예약 흐름과 바로 가기" className="seller-panel-board">
          <div className="opsdash-board-grid seller-board-grid">
            <div className="opsdash-board-section">
              <div className="opsdash-board-head">
                <strong>예약 전환과 체크인</strong>
                <span>주간 흐름</span>
              </div>
              <DashboardTrendList rows={vm.trends} />
            </div>

            <div className="opsdash-board-section">
              <div className="opsdash-board-head">
                <strong>바로 가기</strong>
                <span>자주 여는 메뉴</span>
              </div>
              <DashboardLinkList items={vm.quickLinks} />
            </div>
          </div>
        </DashboardPanel>
      </div>
    </DashboardLayout>
  );
}
