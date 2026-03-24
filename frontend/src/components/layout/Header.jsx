import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthSession, readAuthSession } from "../../utils/authSession";

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

  const membershipLabel = session?.provider === "KAKAO" ? "Basic" : session?.provider === "NAVER" ? "Naver" : session?.provider === "GOOGLE" ? "Google" : "Basic";

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
                  <strong>{session.name}</strong>
                  <span>{membershipLabel} 회원</span>
                </span>
                <span className="header-profile-toggle" aria-hidden="true">☰</span>
              </button>
              {menuOpen ? (
                <div className="header-profile-dropdown">
                  <div className="header-profile-dropdown-head">
                    <strong>{session.name}</strong>
                    <p>
                      <span>{membershipLabel}</span> 회원
                    </p>
                  </div>
                  <div className="header-profile-dropdown-links">
                    <Link className="header-dropdown-link" to="/my">마이페이지</Link>
                    <Link className="header-dropdown-link" to="/my/bookings">예약 내역</Link>
                    <Link className="header-dropdown-link" to="/my/wishlist">찜 목록</Link>
                    <Link className="header-dropdown-link" to="/my/mileage">마일리지</Link>
                    <Link className="header-dropdown-link" to="/my/coupons">쿠폰</Link>
                    <Link className="header-dropdown-link" to="/my/profile">내 정보 관리</Link>
                    <Link className="header-dropdown-link" to="/my/payments">결제 내역</Link>
                    <Link className="header-dropdown-link" to="/my/inquiries">문의센터</Link>
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
