import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getAdminInquiries, updateAdminInquiryStatus } from "../../services/dashboardService";

const columns = [
  { key: "title", label: "제목" },
  { key: "type", label: "유형" },
  { key: "status", label: "상태" },
  { key: "date", label: "접수일" },
];

export default function AdminInquiriesPage() {
  const [rows, setRows] = useState(() => getAdminInquiries());
  const [selectedTitle, setSelectedTitle] = useState(rows[0]?.title ?? null);
  const selected = rows.find((row) => row.title === selectedTitle) ?? rows[0];

  const updateStatus = (nextStatus) => {
    if (!selected) return;
    const nextRows = updateAdminInquiryStatus(selected.title, nextStatus);
    setRows(nextRows);
  };

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">문의 운영</p>
          <h1>문의 모니터링</h1>
          <p>접수 {rows.filter((r) => r.status === "OPEN").length} · 답변완료 {rows.filter((r) => r.status === "ANSWERED").length} · 종료 {rows.filter((r) => r.status === "CLOSED").length}</p>
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.title}
            selectedKey={selectedTitle}
            onRowClick={(row) => setSelectedTitle(row.title)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selected?.title ?? "—"}</h3>
          <p>{selected?.type} · {selected?.date}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("ANSWERED")}>답변 완료</button>
            <button type="button" className="dash-action-btn" onClick={() => updateStatus("CLOSED")}>종료</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
