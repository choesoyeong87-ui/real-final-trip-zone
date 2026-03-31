import { useEffect, useState } from "react";
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
  const [rows, setRows] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const selected = rows.find((row) => String(row.id) === String(selectedKey)) ?? rows[0];

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getAdminReviews();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedKey(nextRows[0]?.id ?? null);
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
      setNotice(error.message);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">리뷰 운영</p>
          <h1>리뷰 관리</h1>
          <p>노출 {rows.filter((r) => r.status === "VISIBLE").length} · 숨김 {rows.filter((r) => r.status === "HIDDEN").length} · 신고 {rows.filter((r) => r.status === "REPORTED").length}</p>
          {notice ? <p>{notice}</p> : null}
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          {isLoading ? <div className="my-empty-inline">리뷰 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedKey}
            onRowClick={(row) => setSelectedKey(row.id)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selected?.lodging ?? "—"}</h3>
          <p>{selected?.author} · ★{selected?.score}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("VISIBLE")} disabled={!selected}>노출</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("HIDDEN")} disabled={!selected}>숨김</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
