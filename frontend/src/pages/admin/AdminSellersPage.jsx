import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getAdminSellers, updateAdminSellerStatus } from "../../services/dashboardService";

const columns = [
  { key: "business", label: "상호명" },
  { key: "owner", label: "대표자" },
  { key: "status", label: "승인 상태" },
  { key: "region", label: "지역" },
];

export default function AdminSellersPage() {
  const [rows, setRows] = useState(() => getAdminSellers());
  const [selectedBusiness, setSelectedBusiness] = useState(rows[0]?.business ?? null);
  const selectedSeller = rows.find((row) => row.business === selectedBusiness) ?? rows[0];

  const updateStatus = (nextStatus) => {
    if (!selectedSeller) return;
    const nextRows = updateAdminSellerStatus(selectedSeller.business, nextStatus);
    setRows(nextRows);
  };

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">판매자 운영</p>
          <h1>판매자 관리</h1>
          <p>대기 {rows.filter((r) => r.status === "PENDING").length} · 승인 {rows.filter((r) => r.status === "APPROVED").length} · 중지 {rows.filter((r) => r.status === "SUSPENDED").length}</p>
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.business}
            selectedKey={selectedBusiness}
            onRowClick={(row) => setSelectedBusiness(row.business)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selectedSeller?.business ?? "—"}</h3>
          <p>{selectedSeller?.owner} · {selectedSeller?.region}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("APPROVED")}>승인</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("REJECTED")}>반려</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("SUSPENDED")}>중지</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
