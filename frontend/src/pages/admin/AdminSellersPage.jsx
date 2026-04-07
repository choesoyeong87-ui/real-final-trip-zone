import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import { getAdminSellers, updateAdminSellerStatus } from "../../services/dashboardService";

const columns = [
  { key: "business", label: "상호명" },
  { key: "owner", label: "대표자" },
  { key: "status", label: "승인 상태" },
  { key: "region", label: "지역" },
];

export default function AdminSellersPage() {
  const [rows, setRows] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const selectedSeller = rows.find((row) => row.id === selectedSellerId) ?? rows[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getAdminSellers();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedSellerId(nextRows[0]?.id ?? null);
        setNotice("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load admin sellers.", error);
        setNotice("판매자 목록을 불러오지 못했습니다.");
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
    if (!selectedSeller) return;
    try {
      const nextRows = await updateAdminSellerStatus(selectedSeller.id, nextStatus);
      setRows(nextRows);
      setSelectedSellerId(nextRows.find((row) => row.id === selectedSeller.id)?.id ?? nextRows[0]?.id ?? null);
      setNotice("판매자 상태를 변경했습니다.");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "판매자 상태를 변경하지 못했습니다."));
    }
  };

  return (
    <DashboardLayout role="admin">
      {notice ? <div className="my-empty-inline">{notice}</div> : null}
      <div className="saas-bento-split seller-crud-split">
        <section className="saas-bento-panel seller-crud-table-section">
          {isLoading ? <div className="my-empty-inline">판매자 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedSellerId}
            onRowClick={(row) => setSelectedSellerId(row.id)}
          />
        </section>

        <aside className="saas-bento-panel">
          <div className="saas-bento-head">
            <strong>{selectedSeller?.business ?? "판매자를 선택해 주세요"}</strong>
            {selectedSeller ? <p>{selectedSeller.owner} · {selectedSeller.region}</p> : null}
          </div>
          <div className="dash-chips">
            <span className="dash-chip is-warning">승인 대기 {rows.filter((row) => row.status === "PENDING").length}건</span>
            <span className="dash-chip is-accent">승인 {rows.filter((row) => row.status === "APPROVED").length}건</span>
            <span className="dash-chip is-danger">중지 {rows.filter((row) => row.status === "SUSPENDED").length}건</span>
          </div>
          <div className="saas-form-actions saas-form-actions-start">
            <button type="button" className="saas-btn-primary" onClick={() => updateStatus("ACTIVE")} disabled={!selectedSeller}>
              복구
            </button>
            <button type="button" className="saas-btn-primary" onClick={() => updateStatus("APPROVED")} disabled={!selectedSeller}>
              승인
            </button>
            <button type="button" className="saas-btn-danger" onClick={() => updateStatus("REJECTED")} disabled={!selectedSeller}>
              반려
            </button>
            <button type="button" className="saas-btn-danger" onClick={() => updateStatus("SUSPENDED")} disabled={!selectedSeller}>
              중지
            </button>
          </div>
          <form className="saas-create-form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="saas-field">
              <span>상호명</span>
              <input value={selectedSeller?.business ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>대표자</span>
              <input value={selectedSeller?.owner ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>사업자번호</span>
              <input value={selectedSeller?.businessNo ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>정산 계좌</span>
              <input value={selectedSeller?.account ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>신청일</span>
              <input value={selectedSeller?.submittedAt ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>최근 수정</span>
              <input value={selectedSeller?.updatedAt ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>반려 사유</span>
              <textarea rows={4} value={selectedSeller?.rejectReason ?? ""} readOnly />
            </label>
          </form>
        </aside>
      </div>
    </DashboardLayout>
  );
}
