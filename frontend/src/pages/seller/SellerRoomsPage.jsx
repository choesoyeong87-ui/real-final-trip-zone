import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getSellerRooms, updateSellerRoomStatus } from "../../services/dashboardService";

const columns = [
  { key: "name", label: "객실명" },
  { key: "type", label: "유형" },
  { key: "lodging", label: "숙소명" },
  { key: "status", label: "상태" },
  { key: "capacity", label: "최대 인원" },
  { key: "price", label: "가격" },
];

export default function SellerRoomsPage() {
  const [rows, setRows] = useState(() => getSellerRooms());
  const [selectedKey, setSelectedKey] = useState(rows[0] ? `${rows[0].lodging}-${rows[0].name}` : null);
  const selected = rows.find((row) => `${row.lodging}-${row.name}` === selectedKey) ?? rows[0];

  const updateStatus = (nextStatus) => {
    if (!selected) return;
    const nextRows = updateSellerRoomStatus(selectedKey, nextStatus);
    setRows(nextRows);
  };

  return (
    <DashboardLayout role="seller">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">객실 운영</p>
          <h1>객실 관리</h1>
          <p>예약 가능 {rows.filter((r) => r.status === "AVAILABLE").length}개 · 불가 {rows.filter((r) => r.status === "UNAVAILABLE").length}개</p>
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => `${row.lodging}-${row.name}`}
            selectedKey={selectedKey}
            onRowClick={(row) => setSelectedKey(`${row.lodging}-${row.name}`)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selected?.name ?? "—"}</h3>
          <p>{selected?.lodging} · {selected?.type}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("AVAILABLE")}>예약 가능</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("UNAVAILABLE")}>예약 불가</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
