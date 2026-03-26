import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getSellerAssets, updateSellerAsset } from "../../services/dashboardService";

const columns = [
  { key: "lodging", label: "숙소명" },
  { key: "type", label: "이미지 유형" },
  { key: "order", label: "정렬 순서" },
  { key: "status", label: "노출 상태" },
];

export default function SellerAssetsPage() {
  const [rows, setRows] = useState(() => getSellerAssets());
  const [selectedKey, setSelectedKey] = useState(rows[0] ? `${rows[0].lodging}-${rows[0].type}` : null);
  const selected = rows.find((row) => `${row.lodging}-${row.type}` === selectedKey) ?? rows[0];

  const updateSelected = (patch) => {
    if (!selected) return;
    const nextRows = updateSellerAsset(selectedKey, patch);
    setRows(nextRows);
  };

  return (
    <DashboardLayout role="seller">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">이미지 운영</p>
          <h1>숙소 이미지 관리</h1>
          <p>대표 {rows.filter((r) => r.type === "대표 이미지").length}개 · 검수중 {rows.filter((r) => r.status === "검수중").length}개</p>
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => `${row.lodging}-${row.type}`}
            selectedKey={selectedKey}
            onRowClick={(row) => setSelectedKey(`${row.lodging}-${row.type}`)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selected?.lodging ?? "—"}</h3>
          <p>{selected?.type} · 순서 {selected?.order}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateSelected({ status: "노출중" })}>노출</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateSelected({ status: "검수중" })}>검수중</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
