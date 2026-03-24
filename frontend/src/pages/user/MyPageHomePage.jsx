import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  couponRows,
  myBookingRows,
  myPageSections,
  myProfileSummary,
  paymentHistoryRows,
  wishlistRows,
} from "../../data/siteData";

export default function MyPageHomePage() {
  const upcomingCount = myBookingRows.filter((item) => item.status !== "COMPLETED").length;
  const availableCouponCount = couponRows.filter((item) => item.status === "사용 가능").length;
  const paidCount = paymentHistoryRows.filter((item) => item.status === "PAID").length;

  const overviewItems = [
    { label: "예약중", value: `${upcomingCount}건`, href: "/my/bookings" },
    { label: "찜 목록", value: `${wishlistRows.length}건`, href: "/my/wishlist" },
    { label: "사용 가능 쿠폰", value: `${availableCouponCount}장`, href: "/my/coupons" },
    { label: "결제 완료", value: `${paidCount}건`, href: "/my/payments" },
  ];

  return (
    <MyPageLayout>
      <section className="my-list-sheet my-home-sheet">
        <header className="my-home-topline">
          <div className="my-home-topline-copy">
            <span className="my-home-label">MY PAGE</span>
            <strong>{myProfileSummary.name}</strong>
            <p>{myProfileSummary.gradeHint}</p>
          </div>
          <div className="my-home-topline-meta">
            <span className="my-stat-pill is-mint">{myProfileSummary.status}</span>
            <span className="my-stat-pill">{myProfileSummary.grade} 회원</span>
            <span className="my-stat-pill is-soft">{myProfileSummary.joinedAt}</span>
          </div>
        </header>

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
              <strong>자주 쓰는 메뉴</strong>
              <p>내 예약 화면 문법에 맞춰 필요한 정보와 이동만 남겼습니다.</p>
            </div>
          </div>
          <div className="my-home-shortcut-list">
            {myPageSections.map((item) => (
              <Link key={item.href} to={item.href} className="my-home-shortcut-row">
                <div className="my-home-shortcut-copy">
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>
                <span>이동</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </MyPageLayout>
  );
}
