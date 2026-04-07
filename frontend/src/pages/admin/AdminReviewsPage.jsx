import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import { getAdminReviews, updateAdminReviewStatus } from "../../services/dashboardService";

const columns = [
  { key: "lodging", label: "숙소" },
  { key: "author", label: "작성자" },
  { key: "score", label: "평점" },
  { key: "status", label: "상태" },
  { key: "report", label: "신고" },
];

export default function AdminReviewsPage() {
  const [rows, setRows] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const selected = rows.find((row) => String(row.id) === String(selectedKey)) ?? rows[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getAdminReviews();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedKey(nextRows[0]?.id ?? null);
        setNotice("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load admin reviews.", error);
        setNotice("리뷰 목록을 불러오지 못했습니다.");
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
      const updated = await updateAdminReviewStatus(selected.id, nextStatus);
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setNotice(`리뷰 상태를 ${nextStatus === "VISIBLE" ? "노출" : "숨김"}으로 변경했습니다.`);
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "리뷰 상태를 변경하지 못했습니다."));
    }
  };

  return (
    <DashboardLayout role="admin">
      {notice ? <div className="my-empty-inline">{notice}</div> : null}
      <div className="saas-bento-split seller-crud-split">
        <section className="saas-bento-panel seller-crud-table-section">
          {isLoading ? <div className="my-empty-inline">리뷰 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedKey}
            onRowClick={(row) => setSelectedKey(row.id)}
          />
        </section>

        <aside className="saas-bento-panel">
          <div className="saas-bento-head">
            <strong>{selected?.lodging ?? "리뷰를 선택해 주세요"}</strong>
            {selected ? <p>{selected.author} · ★{selected.score}</p> : null}
          </div>
          <div className="dash-chips">
            <span className="dash-chip is-accent">노출 {rows.filter((row) => row.status === "VISIBLE").length}건</span>
            <span className="dash-chip">숨김 {rows.filter((row) => row.status === "HIDDEN").length}건</span>
            <span className="dash-chip is-warning">신고 {rows.filter((row) => row.status === "REPORTED").length}건</span>
          </div>
          <div className="saas-form-actions saas-form-actions-start">
            <button type="button" className="saas-btn-primary" onClick={() => updateStatus("VISIBLE")} disabled={!selected}>
              노출
            </button>
            <button type="button" className="saas-btn-danger" onClick={() => updateStatus("HIDDEN")} disabled={!selected}>
              숨김
            </button>
          </div>
          <form className="saas-create-form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="saas-field">
              <span>숙소</span>
              <input value={selected?.lodging ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>작성자</span>
              <input value={selected?.author ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>평점</span>
              <input value={selected?.score ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>신고 수</span>
              <input value={selected?.report ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>리뷰 내용</span>
              <textarea rows={5} value={selected?.summary ?? ""} readOnly />
            </label>
          </form>
        </aside>
      </div>
    </DashboardLayout>
  );
}
