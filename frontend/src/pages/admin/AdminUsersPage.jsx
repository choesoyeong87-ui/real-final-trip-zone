import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import { getAdminUserDetail, getAdminUsers, updateAdminUserStatus } from "../../services/dashboardService";

const columns = [
  { key: "name", label: "회원명" },
  { key: "role", label: "권한" },
  { key: "status", label: "상태" },
  { key: "email", label: "이메일" },
];

export default function AdminUsersPage() {
  const [rows, setRows] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const selectedUser = rows.find((row) => row.id === selectedUserId) ?? rows[0] ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setIsLoading(true);
        const nextRows = await getAdminUsers();
        if (cancelled) return;
        setRows(nextRows);
        setSelectedUserId(nextRows[0]?.id ?? null);
        setNotice("");
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load admin users.", error);
        setNotice("회원 목록을 불러오지 못했습니다.");
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

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!selectedUserId) {
        setDetail(null);
        return;
      }

      try {
        const nextDetail = await getAdminUserDetail(selectedUserId);
        if (cancelled) return;
        setDetail(nextDetail);
      } catch {
        if (cancelled) return;
        setDetail(null);
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedUserId]);

  const updateStatus = async (nextStatus) => {
    if (!selectedUser) return;
    try {
      const updatedUser = await updateAdminUserStatus(selectedUser.id, nextStatus);
      setRows((current) => current.map((row) => (row.id === updatedUser.id ? updatedUser : row)));
      setNotice("회원 상태를 변경했습니다.");
    } catch (error) {
      setNotice(toUserFacingErrorMessage(error, "회원 상태를 변경하지 못했습니다."));
    }
  };

  return (
    <DashboardLayout role="admin">
      {notice ? <div className="my-empty-inline">{notice}</div> : null}
      <div className="saas-bento-split seller-crud-split">
        <section className="saas-bento-panel seller-crud-table-section">
          {isLoading ? <div className="my-empty-inline">회원 목록을 불러오는 중입니다.</div> : null}
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            selectedKey={selectedUserId}
            onRowClick={(row) => setSelectedUserId(row.id)}
          />
        </section>

        <aside className="saas-bento-panel">
          <div className="saas-bento-head">
            <strong>{detail?.name ?? selectedUser?.name ?? "회원을 선택해 주세요"}</strong>
            {selectedUser ? <p>{detail?.email ?? selectedUser.email}</p> : null}
          </div>
          <div className="dash-chips">
            <span className="dash-chip is-accent">활성 {rows.filter((row) => row.status === "ACTIVE").length}명</span>
            <span className="dash-chip is-warning">휴면 {rows.filter((row) => row.status === "DORMANT").length}명</span>
            <span className="dash-chip is-danger">차단 {rows.filter((row) => row.status === "BLOCKED").length}명</span>
          </div>
          <div className="saas-form-actions saas-form-actions-start">
            <button type="button" className="saas-btn-primary" onClick={() => updateStatus("ACTIVE")} disabled={!selectedUser}>
              활성
            </button>
            <button type="button" className="saas-btn-danger" onClick={() => updateStatus("BLOCKED")} disabled={!selectedUser}>
              차단
            </button>
          </div>
          <form className="saas-create-form-grid" onSubmit={(event) => event.preventDefault()}>
            <label className="saas-field">
              <span>회원명</span>
              <input value={detail?.name ?? selectedUser?.name ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>이메일</span>
              <input value={detail?.email ?? selectedUser?.email ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>권한</span>
              <input value={detail?.role ?? selectedUser?.role ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>상태</span>
              <input value={detail?.status ?? selectedUser?.status ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>전화번호</span>
              <input value={detail?.phone ?? selectedUser?.phone ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>회원등급</span>
              <input value={detail?.grade ?? selectedUser?.grade ?? ""} readOnly />
            </label>
            <label className="saas-field">
              <span>마일리지</span>
              <input value={`${Number(detail?.mileage ?? selectedUser?.mileage ?? 0).toLocaleString()}점`} readOnly />
            </label>
          </form>
        </aside>
      </div>
    </DashboardLayout>
  );
}
