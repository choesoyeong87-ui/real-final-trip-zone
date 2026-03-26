import { Link, useLocation } from "react-router-dom";

const ADMIN_MENU = [
  { label: "대시보드", to: "/admin", icon: "📊" },
  { label: "회원 관리", to: "/admin/users", icon: "👤" },
  { label: "판매자 관리", to: "/admin/sellers", icon: "🏢" },
  { label: "이벤트 · 쿠폰", to: "/admin/events", icon: "🎫" },
  { label: "문의 모니터링", to: "/admin/inquiries", icon: "💬" },
  { label: "리뷰 운영", to: "/admin/reviews", icon: "⭐" },
  { label: "운영 로그", to: "/admin/audit-logs", icon: "📋" },
];

const SELLER_MENU = [
  { label: "대시보드", to: "/seller", icon: "📊" },
  { label: "숙소 관리", to: "/seller/lodgings", icon: "🏠" },
  { label: "객실 관리", to: "/seller/rooms", icon: "🛏️" },
  { label: "이미지 관리", to: "/seller/assets", icon: "🖼️" },
  { label: "예약 관리", to: "/seller/reservations", icon: "📅" },
  { label: "문의 관리", to: "/seller/inquiries", icon: "💬" },
  { label: "판매자 신청", to: "/seller/apply", icon: "📝" },
];

export default function DashboardLayout({ role, children }) {
  const location = useLocation();
  const menu = role === "admin" ? ADMIN_MENU : SELLER_MENU;
  const roleLabel = role === "admin" ? "관리자센터" : "판매자센터";
  const roleClass = role === "admin" ? "is-admin" : "is-seller";

  return (
    <div className={`dash-layout ${roleClass}`}>
      <aside className="dash-sidebar">
        <div className="dash-sidebar-head">
          <span className="dash-sidebar-badge">{role === "admin" ? "A" : "S"}</span>
          <div className="dash-sidebar-info">
            <strong>{roleLabel}</strong>
            <span>TripZone</span>
          </div>
        </div>

        <nav className="dash-sidebar-nav">
          {menu.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`dash-sidebar-link${isActive ? " is-active" : ""}`}
              >
                <span className="dash-sidebar-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="dash-sidebar-footer">
          <Link to="/" className="dash-sidebar-back">← 메인으로</Link>
        </div>
      </aside>

      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
