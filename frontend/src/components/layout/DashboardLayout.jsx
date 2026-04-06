import { Link, useLocation } from "react-router-dom";

const ADMIN_MENU = [
  {
    category: "핵심 요약",
    items: [{ label: "대시보드", to: "/admin" }]
  },
  {
    category: "고객/회원",
    items: [
      { label: "회원 관리", to: "/admin/users" },
      { label: "판매자 관리", to: "/admin/sellers" }
    ]
  },
  {
    category: "운영/서비스",
    items: [
      { label: "이벤트 · 쿠폰", to: "/admin/events" },
      { label: "문의 모니터링", to: "/admin/inquiries" },
      { label: "리뷰 운영", to: "/admin/reviews" }
    ]
  }
];

const SELLER_MENU = [
  {
    category: "운영 요약",
    items: [{ label: "대시보드", to: "/seller" }]
  },
  {
    category: "상품 관리",
    items: [
      { label: "숙소 관리", to: "/seller/lodgings" },
      { label: "객실 관리", to: "/seller/rooms" },
      { label: "이미지 관리", to: "/seller/assets" }
    ]
  },
  {
    category: "예약 및 고객",
    items: [
      { label: "예약 관리", to: "/seller/reservations" },
      { label: "문의 관리", to: "/seller/inquiries" }
    ]
  }
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
          <div className="dash-sidebar-info">
            <strong>{roleLabel}</strong>
            <span>TripZone</span>
          </div>
        </div>

        <nav className="dash-sidebar-nav">
          {menu.map((group, groupIdx) => (
            <div key={groupIdx} className="dash-sidebar-group">
              <span className="dash-sidebar-category">{group.category}</span>
              {group.items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`dash-sidebar-link${isActive ? " is-active" : ""}`}
                  >
                    <span className="dash-sidebar-label">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
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
