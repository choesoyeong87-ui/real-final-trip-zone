import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getAdminReviews, updateAdminReviewStatus } from "../../services/dashboardService";

const columns = [
  { key: "lodging", label: "숙소" },
  { key: "author", label: "작성자" },
  { key: "score", label: "평점" },
  { key: "status", label: "상태" },
  { key: "report", label: "신고" },
];

export default function AdminReviewsPage() {
  const [rows, setRows] = useState(() => getAdminReviews());
  const [selectedKey, setSelectedKey] = useState(rows[0] ? `${rows[0].lodging}-${rows[0].author}` : null);
  const selected = rows.find((row) => `${row.lodging}-${row.author}` === selectedKey) ?? rows[0];

  const updateStatus = (nextStatus) => {
    if (!selected) return;
    const nextRows = updateAdminReviewStatus(selectedKey, nextStatus);
    setRows(nextRows);
  };

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">리뷰 운영</p>
          <h1>리뷰 관리</h1>
          <p>노출 {rows.filter((r) => r.status === "VISIBLE").length} · 숨김 {rows.filter((r) => r.status === "HIDDEN").length} · 신고 {rows.filter((r) => r.status === "REPORTED").length}</p>
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => `${row.lodging}-${row.author}`}
            selectedKey={selectedKey}
            onRowClick={(row) => setSelectedKey(`${row.lodging}-${row.author}`)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selected?.lodging ?? "—"}</h3>
          <p>{selected?.author} · ★{selected?.score}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("VISIBLE")}>노출</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("HIDDEN")}>숨김</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
