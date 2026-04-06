const CODE_LABELS = {
  ROLE_USER: "일반회원",
  ROLE_HOST: "판매자",
  ROLE_ADMIN: "관리자",
  ACTIVE: "활성",
  DORMANT: "휴면",
  BLOCKED: "차단",
  DELETED: "탈퇴",
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "반려",
  SUSPENDED: "중지",
  INACTIVE: "비노출",
  AVAILABLE: "예약 가능",
  UNAVAILABLE: "예약 불가",
  CONFIRMED: "확정",
  CANCELED: "취소",
  COMPLETED: "숙박 완료",
  NO_SHOW: "노쇼",
  READY: "결제 준비",
  PAID: "결제 완료",
  FAILED: "실패",
  PARTIAL_CANCELED: "부분 취소",
  REFUNDED: "환불",
  OPEN: "접수",
  ANSWERED: "답변 완료",
  CLOSED: "종료",
  LODGING: "숙소",
  BOOKING: "예약",
  PAYMENT: "결제",
  SYSTEM: "시스템",
};

const STATUS_KEYS = new Set([
  "role",
  "status",
  "type",
]);

function renderCell(column, row) {
  if (typeof column.render === "function") {
    return column.render(row[column.key], row);
  }

  const columnKey = column.key;
  const value = row[columnKey];
  const text = String(value ?? "");

  if (STATUS_KEYS.has(columnKey)) {
    const label = CODE_LABELS[text] ?? text;
    return (
      <span className={`table-code code-${text.toLowerCase()}`}>
        {label}
      </span>
    );
  }

  return text;
}

export default function DataTable({
  columns,
  rows,
  getRowKey = (_, index) => index,
  selectedKey = null,
  onRowClick,
}) {
  return (
    <div className="table-card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className={selectedKey === getRowKey(row, index) ? "is-selected" : ""}
                data-clickable={onRowClick ? "true" : "false"}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>{renderCell(column, row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
