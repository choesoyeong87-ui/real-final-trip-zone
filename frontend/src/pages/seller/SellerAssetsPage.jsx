import { useEffect, useState } from "react";
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
  const [rows, setRows] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const selected = rows.find((row) => row.id === selectedKey) ?? rows[0];

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getSellerAssets();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedKey(nextRows[0]?.id ?? null);
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load seller assets.", error);
        setNotice("이미지 목록을 불러오지 못했습니다.");
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

  const updateSelected = async (patch) => {
    if (!selected) return;
    try {
      const updated = await updateSellerAsset(selected.id, patch);
      const nextRows = await getSellerAssets();
      setRows(nextRows);
      setSelectedKey(updated?.id ?? nextRows[0]?.id ?? null);
      setNotice(patch.mode === "PRIMARY" ? "대표 이미지를 변경했습니다." : "이미지를 마지막 순서로 이동했습니다.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <DashboardLayout role="seller">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">이미지 운영</p>
          <h1>숙소 이미지 관리</h1>
          <p>대표 {rows.filter((r) => r.type === "대표 이미지").length}개 · 일반 {rows.filter((r) => r.type === "일반 이미지").length}개</p>
          {notice ? <p>{notice}</p> : null}
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          {isLoading ? <div className="my-empty-inline">이미지 목록을 불러오는 중입니다.</div> : null}
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
          <p>{selected?.type} · 순서 {selected?.order}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateSelected({ mode: "PRIMARY" })} disabled={!selected || !selected.fileName}>대표 지정</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateSelected({ mode: "LAST" })} disabled={!selected || !selected.fileName}>뒤로 이동</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
