import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { membershipMilestones, myBookingRows, myProfileSummary } from "../../data/mypageData";
import { clearAuthSession, readAuthSession } from "../../features/auth/authSession";
import { getHeaderRoleLinks, getMembershipLabel } from "../../features/auth/authViewModels";
import { getMyCoupons } from "../../services/mypageService";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => readAuthSession());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setSession(readAuthSession());
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
    setMenuOpen(false);
    navigate("/");
  };

  const handleMembershipClick = (event) => {
    event.stopPropagation();
    setMenuOpen(false);
    navigate("/my/membership");
  };

  const membershipLabel = session?.role === "ROLE_USER" ? myProfileSummary.grade : getMembershipLabel(session);
  const profileLabel = session?.name ?? myProfileSummary.name;
  const roleLinks = getHeaderRoleLinks(session);
  const availableCouponCount = session?.role === "ROLE_USER" ? getMyCoupons().filter((item) => item.status === "사용 가능").length : 0;
  const upcomingBookingCount = session?.role === "ROLE_USER" ? myBookingRows.filter((item) => item.status !== "COMPLETED").length : 0;
  const mileageValue = membershipMilestones.find((item) => item.label === "누적 마일리지")?.value ?? "0P";

  return (
    <header className="header">
      <div className="header-frame header-inner">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-mark-wave" />
            <span className="brand-mark-sun" />
          </span>
          <span className="brand-copy">
            <span className="brand-main">TripZone</span>
            <span className="brand-sub">stay and travel</span>
          </span>
        </Link>
        <div className="header-utility">
          {session ? (
            <div className="header-profile-menu" ref={menuRef}>
              <button type="button" className={`header-profile-chip${menuOpen ? " is-open" : ""}`} onClick={() => setMenuOpen((current) => !current)}>
                <span className="header-profile-badge" aria-hidden="true">
                  <span className="header-profile-badge-wave" />
                  <span className="header-profile-badge-sun" />
                </span>
                <span className="header-profile-copy">
                  <strong>{profileLabel}</strong>
                  <span
                    className="header-membership-link"
                    role="link"
                    tabIndex={0}
                    onClick={handleMembershipClick}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleMembershipClick(event);
                      }
                    }}
                  >
                    {membershipLabel} 회원
                  </span>
                </span>
                <span className="header-profile-toggle" aria-hidden="true">☰</span>
              </button>
              {menuOpen ? (
                <div className="header-profile-dropdown">
                  {session?.role === "ROLE_USER" ? (
                    <div className="header-profile-summary">
                      <div className="header-profile-stats">
                        <Link className="header-profile-stat" to="/my/mileage">
                          <span>마일리지</span>
                          <strong>{mileageValue}</strong>
                        </Link>
                        <Link className="header-profile-stat" to="/my/coupons">
                          <span>쿠폰</span>
                          <strong>{availableCouponCount}장</strong>
                        </Link>
                        <Link className="header-profile-stat" to="/my/bookings">
                          <span>예약중</span>
                          <strong>{upcomingBookingCount}건</strong>
                        </Link>
                      </div>
                    </div>
                  ) : null}
                  <div className="header-profile-dropdown-links">
                    {roleLinks.map((item) => (
                      <Link key={item.to} className="header-dropdown-link" to={item.to}>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <button type="button" className="header-dropdown-logout" onClick={handleLogout}>
                    로그아웃
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link className="utility-link" to="/login">
                로그인
              </Link>
              <Link className="header-signup" to="/signup">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
