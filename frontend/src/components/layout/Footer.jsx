import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-topline">
          <div className="footer-brand-block">
            <Link className="brand footer-brand" to="/">
              <span className="brand-mark" aria-hidden="true">
                <span className="brand-mark-wave" />
                <span className="brand-mark-sun" />
              </span>
              <span className="brand-copy">
                <span className="brand-main">TripZone</span>
                <span className="brand-sub">stay and travel</span>
              </span>
            </Link>
            <p>국내 프리미엄 스테이를 차분하게 탐색하고 예약까지 이어지는 숙소 예약 서비스</p>
            <div className="footer-service-note">
              <span>Reservation support 09:00 - 23:00</span>
              <span>same-day booking · schedule changes</span>
            </div>
          </div>
          <div className="footer-link-grid">
            <div className="footer-link-block">
              <strong>Browse</strong>
              <Link to="/lodgings">국내 숙소</Link>
              <Link to="/lodgings?theme=deal">오늘 특가</Link>
              <Link to="/my/bookings">예약 내역</Link>
            </div>
            <div className="footer-link-block">
              <strong>Account</strong>
              <Link to="/my/inquiries">문의 내역</Link>
              <Link to="/login">로그인</Link>
              <Link to="/signup">회원가입</Link>
            </div>
            <div className="footer-link-block">
              <strong>Host</strong>
              <Link to="/seller">호스트 센터</Link>
              <Link to="/seller/rooms">숙소 등록</Link>
              <Link to="/seller/reservations">예약 운영</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottomline">
          <div className="footer-policy-links" aria-label="서비스 안내">
            <span>TripZone 안내</span>
            <span>이용약관</span>
            <span>개인정보처리방침</span>
          </div>
          <div className="footer-meta-group">
            <span>고객센터 1670-2048</span>
            <span>예약 · 결제 문의</span>
            <span>host@tripzone.kr</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
