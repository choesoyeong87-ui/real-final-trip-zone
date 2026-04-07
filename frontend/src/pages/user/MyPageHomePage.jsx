import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { myPageSections } from "../../data/mypageData";
import { formatMembershipLabel } from "../../features/mypage/mypageViewModels";
import { getCachedMyHomeSnapshot, getMyHome } from "../../services/mypageService";

const EMPTY_PROFILE_SUMMARY = {
  name: "TripZone 회원",
  grade: "회원",
  gradeHint: "실제 이용 등급을 불러오지 못했습니다.",
  status: "상태 확인 중",
  joinedAt: "가입일 확인 중",
};

export default function MyPageHomePage() {
  const cachedHomeData = getCachedMyHomeSnapshot();
  const [homeData, setHomeData] = useState(cachedHomeData);
  const [isLoading, setIsLoading] = useState(!cachedHomeData);

  useEffect(() => {
    let cancelled = false;

    async function loadMyHome() {
      try {
        if (!cachedHomeData) {
          setIsLoading(true);
        }
        const response = await getMyHome();
        if (cancelled) return;
        setHomeData(response);
      } catch (error) {
        console.error("Failed to load mypage home.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMyHome();

    return () => {
      cancelled = true;
    };
  }, []);

  const profileSummary = homeData?.profileSummary ?? EMPTY_PROFILE_SUMMARY;
  const overview = homeData?.overview;
  const upcomingCount = overview?.upcomingBookingCount ?? 0;
  const availableCouponCount = overview?.availableCouponCount ?? 0;
  const paidCount = overview?.paidCount ?? 0;
  const overviewItems = [
    { label: "예약중", value: `${upcomingCount}건`, href: "/my/bookings" },
    { label: "찜 목록", value: `${overview?.wishlistCount ?? 0}건`, href: "/my/wishlist" },
    { label: "사용 가능 쿠폰", value: `${availableCouponCount}장`, href: "/my/coupons" },
    { label: "결제 완료", value: `${paidCount}건`, href: "/my/payments" },
  ];
  const shortcutItems = useMemo(() => {
    const menuMap = new Map((homeData?.menus ?? []).map((item) => [item.href, item]));
    return myPageSections.map((item) => ({
      ...item,
      title: menuMap.get(item.href)?.title ?? item.title,
      subtitle: menuMap.get(item.href)?.subtitle ?? item.subtitle,
    }));
  }, [homeData?.menus]);

  return (
    <MyPageLayout>
      <section className="my-list-sheet my-home-sheet">
        {isLoading ? (
          <div className="my-empty-panel">
            <strong>마이페이지 요약을 불러오는 중입니다.</strong>
            <p>회원 요약 정보와 바로가기 메뉴를 동기화하고 있습니다.</p>
          </div>
        ) : null}
        <section className="my-home-hero">
          <Link to="/my/membership" className="my-home-topline my-home-topline-link">
            <div className="my-home-topline-copy">
              <span className="my-home-label">MY PAGE</span>
              <strong>{profileSummary.name}</strong>
              <p>{profileSummary.gradeHint}</p>
            </div>
            <div className="my-home-topline-meta">
              <span className="my-stat-pill is-mint">{profileSummary.status}</span>
              <span className="my-stat-pill">{formatMembershipLabel(profileSummary.grade)}</span>
              <span className="my-stat-pill is-soft">{profileSummary.joinedAt}</span>
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
            {shortcutItems.map((item) => (
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
