import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getSellerReservations, updateSellerReservationStatus } from "../../services/dashboardService";

const columns = [
  { key: "no", label: "예약번호" },
  { key: "guest", label: "예약자" },
  { key: "stay", label: "숙박일" },
  { key: "status", label: "상태" },
  { key: "amount", label: "결제금액" },
];

export default function SellerReservationsPage() {
  const [rows, setRows] = useState(() => getSellerReservations());
  const [selectedNo, setSelectedNo] = useState(rows[0]?.no ?? null);
  const selected = rows.find((row) => row.no === selectedNo) ?? rows[0];

  const updateStatus = (nextStatus) => {
    if (!selected) return;
    const nextRows = updateSellerReservationStatus(selected.no, nextStatus);
    setRows(nextRows);
  };

  return (
    <DashboardLayout role="seller">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">예약 운영</p>
          <h1>예약 관리</h1>
          <p>대기 {rows.filter((r) => r.status === "PENDING").length}건 · 확정 {rows.filter((r) => r.status === "CONFIRMED").length}건 · 취소 {rows.filter((r) => r.status === "CANCELED").length}건</p>
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.no}
            selectedKey={selectedNo}
            onRowClick={(row) => setSelectedNo(row.no)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selected?.no ?? "—"}</h3>
          <p>{selected?.guest} · {selected?.stay}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("CONFIRMED")}>확정</button>
            <button type="button" className="dash-action-btn" onClick={() => updateStatus("COMPLETED")}>완료</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("CANCELED")}>취소</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
