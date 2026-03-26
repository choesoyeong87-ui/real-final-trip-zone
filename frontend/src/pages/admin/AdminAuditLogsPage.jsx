import DashboardLayout from "../../components/layout/DashboardLayout";
import DataTable from "../../components/common/DataTable";
import { getAdminAuditLogs } from "../../services/dashboardService";

const columns = [
  { key: "action", label: "조치" },
  { key: "target", label: "대상" },
  { key: "admin", label: "처리자" },
  { key: "time", label: "일시" },
];

export default function AdminAuditLogsPage() {
  const auditLogRows = getAdminAuditLogs().map((row) => ({
    ...row,
    admin: row.actor,
  }));

  return (
    <DashboardLayout role="admin">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">운영 로그</p>
          <h1>운영 로그</h1>
          <p>관리자 조치 이력을 조회합니다.</p>
        </div>
      </div>

      <section className="dash-content-section">
        <DataTable
          columns={columns}
          rows={auditLogRows}
          getRowKey={(row) => `${row.action}-${row.time}`}
        />
      </section>
    </DashboardLayout>
  );
}
