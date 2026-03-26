import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getSellerLodgings, updateSellerLodgingStatus } from "../../services/dashboardService";

const columns = [
  { key: "name", label: "숙소명" },
  { key: "type", label: "유형" },
  { key: "region", label: "지역" },
  { key: "status", label: "상태" },
  { key: "roomCount", label: "객실" },
  { key: "occupancy", label: "점유율" },
];

export default function SellerLodgingsPage() {
  const [rows, setRows] = useState(() => getSellerLodgings());
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? null);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];

  const updateStatus = (nextStatus) => {
    if (!selected) return;
    const nextRows = updateSellerLodgingStatus(selected.id, nextStatus);
    setRows(nextRows);
  };

  return (
    <DashboardLayout role="seller">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">숙소 운영</p>
          <h1>숙소 관리</h1>
          <p>운영 {rows.filter((r) => r.status === "ACTIVE").length}곳 · 비노출 {rows.filter((r) => r.status === "INACTIVE").length}곳 · 총 객실 {rows.reduce((sum, r) => sum + (r.roomCount || 0), 0)}개</p>
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedId}
            onRowClick={(row) => setSelectedId(row.id)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selected?.name ?? "—"}</h3>
          <p>{selected?.region} · {selected?.type}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("ACTIVE")}>운영</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("INACTIVE")}>비노출</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
