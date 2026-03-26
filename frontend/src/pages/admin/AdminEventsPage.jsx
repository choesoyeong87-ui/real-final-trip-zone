import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getAdminEvents, saveAdminEvent, updateAdminEventStatus } from "../../services/dashboardService";

const columns = [
  { key: "title", label: "이벤트/쿠폰명" },
  { key: "status", label: "상태" },
  { key: "target", label: "대상" },
  { key: "period", label: "운영 기간" },
];

export default function AdminEventsPage() {
  const [rows, setRows] = useState(() => getAdminEvents());
  const [selectedTitle, setSelectedTitle] = useState(rows[0]?.title ?? null);
  const [draft, setDraft] = useState({
    title: rows[0]?.title ?? "",
    target: rows[0]?.target ?? "",
    period: rows[0]?.period ?? "",
  });
  const selectedEvent = rows.find((row) => row.title === selectedTitle) ?? rows[0];

  const syncDraft = (title) => {
    const target = rows.find((row) => row.title === title);
    if (!target) return;
    setDraft({ title: target.title, target: target.target, period: target.period });
  };

  const updateStatus = (nextStatus) => {
    if (!selectedEvent) return;
    const nextRows = updateAdminEventStatus(selectedEvent.title, nextStatus);
    setRows(nextRows);
  };

  const handleSave = () => {
    if (!selectedEvent) return;
    const nextRows = saveAdminEvent(selectedEvent.title, draft);
    setRows(nextRows);
    setSelectedTitle(draft.title);
  };

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">이벤트 운영</p>
          <h1>이벤트 · 쿠폰 관리</h1>
          <p>노출 {rows.filter((r) => r.status === "노출중").length}건 · 검수 {rows.filter((r) => r.status === "검수중").length}건</p>
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.title}
            selectedKey={selectedTitle}
            onRowClick={(row) => {
              setSelectedTitle(row.title);
              syncDraft(row.title);
            }}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selectedEvent?.title ?? "—"}</h3>
          <div className="dash-field">
            <span>이벤트/쿠폰명</span>
            <input value={draft.title} onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))} />
          </div>
          <div className="dash-field">
            <span>대상</span>
            <input value={draft.target} onChange={(e) => setDraft((c) => ({ ...c, target: e.target.value }))} />
          </div>
          <div className="dash-field">
            <span>운영 기간</span>
            <input value={draft.period} onChange={(e) => setDraft((c) => ({ ...c, period: e.target.value }))} />
          </div>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={handleSave}>저장</button>
            <button type="button" className="dash-action-btn" onClick={() => updateStatus("노출중")}>노출</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("숨김")}>숨김</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
