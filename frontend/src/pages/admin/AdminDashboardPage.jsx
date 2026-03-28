import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  DashboardFactGrid,
  DashboardFocusList,
  DashboardLogList,
  DashboardMetricStrip,
  DashboardMixList,
  DashboardPanel,
  DashboardPerformanceList,
  DashboardWatchList,
} from "../../features/dashboard/DashboardUI";
import { getAdminDashboardViewModel } from "../../features/dashboard/dashboardViewModels";
import { getAdminDashboardSnapshot } from "../../services/dashboardService";

export default function AdminDashboardPage() {
  const vm = getAdminDashboardViewModel(getAdminDashboardSnapshot());
  const priorityRows = [...vm.watchRows]
    .sort((a, b) => {
      const score = (item) => {
        if (item.kind === "판매자" && item.status === "PENDING") return 0;
        if (item.kind === "문의" && item.status === "OPEN") return 1;
        if (item.status === "SUSPENDED") return 2;
        return 3;
      };
      return score(a) - score(b);
    })
    .slice(0, 2)
    .map((item) => ({
      ...item,
      label:
        item.kind === "판매자"
          ? item.status === "PENDING"
            ? "판매자 승인"
            : item.status === "SUSPENDED"
              ? "제재 검토"
              : "판매자 상태"
          : "문의 답변",
      actionLabel:
        item.kind === "판매자"
          ? item.status === "PENDING"
            ? "승인 처리"
            : item.status === "SUSPENDED"
              ? "제재 확인"
              : "상태 보기"
          : "문의 처리",
    }));

  return (
    <DashboardLayout role="admin">
      <div className="opsdash is-admin">
        <div className="admin-top-grid">
          <DashboardPanel
            eyebrow="Priority Queue"
            title="지금 바로 처리할 항목"
            tone="strong"
            className="admin-panel-workboard"
          >
            <div className="opsdash-board-section">
              <div className="opsdash-board-head">
                <strong>승인 · 문의 · 제재 우선 큐</strong>
                <span>첫 화면에서 바로 판단하고 이동</span>
              </div>
              <DashboardFocusList rows={priorityRows} compact />
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Risk"
            title="위험 회원과 운영 포인트"
            className="admin-panel-risk"
          >
            <div className="opsdash-board-section">
              <div className="opsdash-board-head">
                <strong>즉시 확인이 필요한 리스크</strong>
                <span>차단, 휴면, 이상 징후를 따로 본다</span>
              </div>
              <DashboardWatchList rows={vm.attentionUsers.slice(0, 1)} compact />
              <DashboardFactGrid items={vm.facts} />
            </div>
          </DashboardPanel>
        </div>

        <DashboardMetricStrip items={vm.metrics.slice(0, 4)} label="관리자 핵심 지표" className="admin-metric-strip" />

        <DashboardPanel eyebrow="Insights" title="예약 흐름과 상위 성과" className="admin-panel-board">
          <div className="opsdash-board-grid admin-board-grid">
            <div className="opsdash-board-section">
              <div className="opsdash-board-head">
                <strong>예약 흐름</strong>
                <span>전체 예약 전환</span>
              </div>
              <DashboardMixList rows={vm.reservationMix} />
            </div>

            <div className="opsdash-board-section">
              <div className="opsdash-board-head">
                <strong>판매 성과 상위 숙소</strong>
                <span>최근 6개월 기준</span>
              </div>
              <DashboardPerformanceList rows={vm.sellerPerformance} />
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel eyebrow="Activity" title="최근 조치 기록" className="admin-panel-log">
          <DashboardLogList rows={vm.logs} />
        </DashboardPanel>
      </div>
    </DashboardLayout>
  );
}
