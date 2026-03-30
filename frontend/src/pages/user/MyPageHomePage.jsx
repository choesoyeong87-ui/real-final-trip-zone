import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  myBookingRows,
  myPageSections,
  myProfileSummary,
  paymentHistoryRows,
  wishlistRows,
} from "../../data/mypageData";
import { readAuthSession } from "../../features/auth/authSession";
import { getMyCoupons } from "../../services/mypageService";

export default function MyPageHomePage() {
  const session = readAuthSession();
  const coupons = getMyCoupons();
  const upcomingCount = myBookingRows.filter((item) => item.status !== "COMPLETED").length;
  const availableCouponCount = coupons.filter((item) => item.status === "사용 가능").length;
  const paidCount = paymentHistoryRows.filter((item) => item.status === "PAID").length;
  const nextTrip = myBookingRows.find((item) => item.status !== "COMPLETED") ?? myBookingRows[0];
  const profileName = session?.name ?? myProfileSummary.name;

  const overviewItems = [
    { label: "예약중", value: `${upcomingCount}건`, href: "/my/bookings" },
    { label: "찜 목록", value: `${wishlistRows.length}건`, href: "/my/wishlist" },
    { label: "사용 가능 쿠폰", value: `${availableCouponCount}장`, href: "/my/coupons" },
    { label: "결제 완료", value: `${paidCount}건`, href: "/my/payments" },
  ];

  return (
    <MyPageLayout>
      <section className="my-list-sheet my-home-sheet">
        <section className="my-home-hero">
          <Link to="/my/membership" className="my-home-topline my-home-topline-link">
            <div className="my-home-topline-copy">
              <span className="my-home-label">MY PAGE</span>
              <strong>{profileName}</strong>
              <p>{myProfileSummary.gradeHint}</p>
            </div>
            <div className="my-home-topline-meta">
              <span className="my-stat-pill is-mint">{myProfileSummary.status}</span>
              <span className="my-stat-pill">{myProfileSummary.grade} 회원</span>
              <span className="my-stat-pill is-soft">{myProfileSummary.joinedAt}</span>
            </div>
          </Link>

          <Link to="/my/bookings" className="my-home-trip-card">
            <div className="my-home-trip-copy">
              <span className="my-home-label">다음 여행</span>
              <strong>{nextTrip.name}</strong>
              <p>{nextTrip.stay} · {nextTrip.roomName}</p>
            </div>
            <div className="my-home-trip-meta">
              <span className={`table-code code-${nextTrip.status.toLowerCase()}`}>{nextTrip.bookingStatusLabel}</span>
              <strong>{nextTrip.price}</strong>
              <span>{nextTrip.guestCount}인 · 예약 상세로 이동</span>
            </div>
          </Link>
        </section>

        <section className="my-home-overview" aria-label="마이페이지 요약">
          {overviewItems.map((item) => (
            <Link key={item.label} to={item.href} className="my-home-overview-item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </Link>
          ))}
        </section>

        <section className="my-home-section">
          <div className="my-home-section-head">
            <div>
              <strong>지금 바로 가는 메뉴</strong>
              <p>예약 확인, 혜택 확인, 계정 정리를 첫 화면에서 바로 이어간다.</p>
            </div>
          </div>
          <div className="my-home-shortcut-grid">
            {myPageSections.map((item) => (
              <Link key={item.href} to={item.href} className={`my-home-shortcut-card is-${item.accent}`}>
                <span className={`my-home-shortcut-icon is-${item.accent}`} aria-hidden="true">{item.icon}</span>
                <div className="my-home-shortcut-copy">
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>
                <span className="my-home-shortcut-arrow">바로가기 →</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </MyPageLayout>
  );
}
