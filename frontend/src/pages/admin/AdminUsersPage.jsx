import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getAdminUsers, updateAdminUserStatus } from "../../services/dashboardService";

const columns = [
  { key: "name", label: "회원명" },
  { key: "role", label: "권한" },
  { key: "status", label: "상태" },
  { key: "email", label: "이메일" },
];

export default function AdminUsersPage() {
  const [rows, setRows] = useState(() => getAdminUsers());
  const [selectedEmail, setSelectedEmail] = useState(rows[0]?.email ?? null);
  const selectedUser = rows.find((row) => row.email === selectedEmail) ?? rows[0];

  const updateStatus = (nextStatus) => {
    if (!selectedUser) return;
    const nextRows = updateAdminUserStatus(selectedUser.email, nextStatus);
    setRows(nextRows);
  };

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">회원 운영</p>
          <h1>회원 관리</h1>
          <p>총 {rows.length}명 · 활성 {rows.filter((r) => r.status === "ACTIVE").length} · 휴면 {rows.filter((r) => r.status === "DORMANT").length} · 차단 {rows.filter((r) => r.status === "BLOCKED").length}</p>
        </div>
      </div>

      <div className="dash-table-split">
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.email}
            selectedKey={selectedEmail}
            onRowClick={(row) => setSelectedEmail(row.email)}
          />
        </section>

        <div className="dash-action-sheet">
          <h3>{selectedUser?.name ?? "—"}</h3>
          <p>{selectedUser?.email}</p>
          <div className="dash-action-grid">
            <button type="button" className="dash-action-btn is-primary" onClick={() => updateStatus("ACTIVE")}>활성</button>
            <button type="button" className="dash-action-btn" onClick={() => updateStatus("DORMANT")}>휴면</button>
            <button type="button" className="dash-action-btn is-danger" onClick={() => updateStatus("BLOCKED")}>차단</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
