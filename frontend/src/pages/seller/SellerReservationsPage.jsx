import { useEffect, useState } from "react";
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
  const [rows, setRows] = useState([]);
  const [selectedNo, setSelectedNo] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const selected = rows.find((row) => row.no === selectedNo) ?? rows[0];

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getSellerReservations();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedNo(nextRows[0]?.no ?? null);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load seller reservations.", error);
        setNotice("예약 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadRows();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateStatus = async (nextStatus) => {
    if (!selected) return;
    try {
      const updated = await updateSellerReservationStatus(selected.no, nextStatus);
      setRows((prev) => prev.map((row) => (row.no === selected.no ? { ...row, ...updated } : row)));
      setNotice("");
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <DashboardLayout role="seller">
      {notice ? <div className="my-empty-inline">{notice}</div> : null}
      <div className="saas-bento-split seller-crud-split">
        <section className="saas-bento-panel seller-crud-table-section seller-reservations-table-section">
          {isLoading ? <div className="my-empty-inline">예약 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.no}
            selectedKey={selectedNo}
            onRowClick={(row) => setSelectedNo(row.no)}
          />
        </section>

        <aside className="saas-bento-panel">
          <div className="saas-bento-head">
            <strong>{selected?.no ? `예약 ${selected.no}` : "예약을 선택해 주세요"}</strong>
            {selected ? <p>{selected.guest} · {selected.stay}</p> : null}
          </div>
          <div className="dash-chips">
            <span className="dash-chip is-warning">대기 {rows.filter((r) => r.status === "PENDING").length}건</span>
            <span className="dash-chip is-accent">확정 {rows.filter((r) => r.status === "CONFIRMED").length}건</span>
            <span className="dash-chip">취소 {rows.filter((r) => r.status === "CANCELED").length}건</span>
          </div>
          <div className="saas-form-actions saas-form-actions-start">
            <button type="button" className="saas-btn-primary" onClick={() => updateStatus("CONFIRMED")} disabled={!selected}>확정</button>
            <button type="button" className="saas-btn-ghost" onClick={() => updateStatus("COMPLETED")} disabled={!selected}>완료</button>
            <button type="button" className="saas-btn-danger" onClick={() => updateStatus("CANCELED")} disabled={!selected}>취소</button>
          </div>
          <form className="saas-create-form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="saas-field">
              <span>예약자</span>
              <input value={selected?.guest ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>숙박일</span>
              <input value={selected?.stay ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>상태</span>
              <input value={selected?.status ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>결제금액</span>
              <input value={selected?.amount ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>상세 정보</span>
              <textarea rows={4} value={selected?.detail ?? ""} readOnly />
            </label>
          </form>
        </aside>
      </div>
    </DashboardLayout>
  );
}
