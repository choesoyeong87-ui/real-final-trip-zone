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
            <p>국내 숙소 탐색부터 예약, 결제, 문의까지 이어지는 여행 예약 서비스</p>
          </div>
          <div className="footer-link-grid">
            <div className="footer-link-block">
              <strong>서비스</strong>
              <Link to="/lodgings">국내 숙소</Link>
              <Link to="/lodgings?theme=deal">오늘 특가</Link>
              <Link to="/my/bookings">예약 내역</Link>
            </div>
            <div className="footer-link-block">
              <strong>지원</strong>
              <Link to="/my/inquiries">문의 내역</Link>
              <Link to="/login">로그인</Link>
              <Link to="/signup">회원가입</Link>
            </div>
            <div className="footer-link-block">
              <strong>운영</strong>
              <Link to="/docs">문서 허브</Link>
              <Link to="/submission-html/presentation/index.html">발표 자료</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottomline">
          <div className="footer-policy-links">
            <Link to="/docs">회사소개</Link>
            <Link to="/docs">이용약관</Link>
            <Link to="/docs">개인정보처리방침</Link>
            <Link to="/docs">전자금융거래 이용약관</Link>
          </div>
          <div className="footer-meta-group">
            <span>고객 지원 09:00 - 18:00</span>
            <span>예약 변경 · 결제 문의</span>
            <span>사업자 제휴 문의</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
