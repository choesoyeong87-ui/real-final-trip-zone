import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import {
  deleteSellerAsset,
  getSellerAssets,
  uploadSellerAsset,
  updateSellerAsset,
} from "../../services/dashboardService";

const columns = [
  { key: "lodging", label: "숙소명" },
  { key: "type", label: "이미지 유형" },
  { key: "displayFileName", label: "파일명" },
  { key: "status", label: "노출 상태" },
];

function decorateRows(rows) {
  return rows.map((row) => ({
    ...row,
    displayFileName: row.fileName ?? "등록된 파일 없음",
  }));
}

export default function SellerAssetsPage() {
  const [rows, setRows] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const selected = rows.find((row) => row.id === selectedKey) ?? rows[0];
  const selectedFileName = selected?.fileName ?? "등록된 파일 없음";
  const selectedActionBlocked = !selected?.fileName || selected?.isExternal;

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getSellerAssets();
        if (cancelled) return;
        setRows(decorateRows(nextRows));
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
      setIsSubmitting(true);
      const updated = await updateSellerAsset(selected.id, patch);
      const nextRows = await getSellerAssets();
      setRows(decorateRows(nextRows));
      setSelectedKey(updated?.id ?? nextRows[0]?.id ?? null);
      setNotice("대표 이미지를 변경했습니다.");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "이미지 상태를 변경하지 못했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpload = async () => {
    if (!selected?.lodgingId) return;
    if (!uploadFiles.length) {
      setNotice("첨부할 이미지를 선택해 주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      const nextRows = await uploadSellerAsset(selected.lodgingId, uploadFiles);
      setRows(decorateRows(nextRows));
      setSelectedKey(nextRows.find((row) => row.lodgingId === selected.lodgingId)?.id ?? nextRows[0]?.id ?? null);
      setUploadFiles([]);
      setNotice("이미지를 첨부했습니다.");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "이미지를 첨부하지 못했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected?.fileName) return;
    try {
      setIsSubmitting(true);
      const nextRows = await deleteSellerAsset(selected.id);
      setRows(decorateRows(nextRows));
      setSelectedKey(nextRows.find((row) => row.lodgingId === selected.lodgingId)?.id ?? nextRows[0]?.id ?? null);
      setNotice("이미지를 삭제했습니다.");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "이미지를 삭제하지 못했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="seller">
      {notice ? <div className="my-empty-inline">{notice}</div> : null}
      <div className="saas-bento-split seller-crud-split">
        <section className="saas-bento-panel seller-crud-table-section">
          {isLoading ? <div className="my-empty-inline">이미지 목록을 불러오는 중입니다.</div> : null}
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
            <strong>{selected?.lodging ?? "이미지를 선택해 주세요"}</strong>
            {selected?.type ? <p>{selected.type} · {selectedFileName}</p> : null}
          </div>
          <div className="dash-chips">
            <span className="dash-chip is-accent">
              대표 {rows.filter((r) => r.type === "대표 이미지").length}개
            </span>
            <span className="dash-chip">
              일반 {rows.filter((r) => r.type === "일반 이미지").length}개
            </span>
          </div>
          {selected?.isExternal ? <div className="my-empty-inline">외부 URL 이미지는 이 화면에서 직접 수정/삭제할 수 없습니다.</div> : null}
          <div className="saas-form-actions saas-form-actions-start">
            <button type="button" className="saas-btn-primary" onClick={() => updateSelected({ mode: "PRIMARY" })} disabled={selectedActionBlocked || isSubmitting}>대표 지정</button>
            <button type="button" className="saas-btn-ghost" onClick={() => updateSelected({ mode: "LAST" })} disabled={selectedActionBlocked || isSubmitting}>뒤로 보내기</button>
            <button type="button" className="saas-btn-ghost" onClick={handleDelete} disabled={selectedActionBlocked || isSubmitting}>이미지 삭제</button>
          </div>
          <form className="saas-create-form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="saas-field">
              <span>숙소</span>
              <input value={selected?.lodging ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>이미지 유형</span>
              <input value={selected?.type ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>파일명</span>
              <input value={selectedFileName} readOnly />
            </label>
            <label className="saas-field">
              <span>노출 상태</span>
              <input value={selected?.status ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>이미지 첨부</span>
              <label className="saas-file-picker">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setUploadFiles(Array.from(event.target.files ?? []))}
                />
                <span className="saas-file-picker-button">파일 선택</span>
                <span className="saas-file-picker-text">
                  {uploadFiles.length ? `새 이미지 ${uploadFiles.length}장 선택` : "선택된 파일 없음"}
                </span>
              </label>
            </label>
            <div className="saas-form-actions">
              <button type="button" className="saas-btn-primary" onClick={handleUpload} disabled={!selected?.lodgingId || !uploadFiles.length || isSubmitting}>
                {isSubmitting ? "처리 중..." : "이미지 첨부"}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </DashboardLayout>
  );
}
