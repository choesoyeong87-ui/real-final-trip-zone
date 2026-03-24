import { Link } from "react-router-dom";
import { useState } from "react";
import MyPageLayout from "../../components/user/MyPageLayout";
import { couponRows } from "../../data/siteData";

export default function MyCouponsPage() {
  const [filter, setFilter] = useState("available");
  const availableCount = couponRows.filter((item) => item.status === "사용 가능").length;
  const expiringCount = couponRows.filter((item) => item.status === "만료 예정").length;
  const usedCount = couponRows.filter((item) => item.status === "사용 완료").length;
  const filteredCoupons = couponRows.filter((item) => {
    if (filter === "available") return item.status === "사용 가능";
    if (filter === "used") return item.status === "사용 완료";
    if (filter === "expiring") return item.status === "만료 예정";
    return false;
  });
  const getCouponAmount = (item) => item.name.match(/(\d[\d,]*%?원?)/)?.[1] ?? "혜택 확인";
  const getCouponToneClass = (item) => {
    if (item.status === "사용 가능") return "is-available";
    if (item.status === "사용 완료") return "is-used";
    return "is-expiring";
  };
  const getCouponVisualClass = (item) => {
    if (item.target.includes("제주")) return "is-jeju";
    if (item.target.includes("서울")) return "is-city";
    if (item.target.includes("전")) return "is-pass";
    return "is-stay";
  };

  return (
    <MyPageLayout>
      <section className="my-list-sheet coupon-sheet coupon-sheet-v2">
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>쿠폰 {couponRows.length}장</strong>
            <p>7일 이내 소멸예정 쿠폰 {expiringCount}장</p>
          </div>
          <span className="my-stat-pill is-soft">보유 쿠폰 관리</span>
        </div>
        <div className="mypage-guide-banner">
          <span>국내 숙소 쿠폰은 TripZone 예약에서 바로 사용할 수 있습니다.</span>
        </div>
        <div className="tab-filter-row" role="tablist" aria-label="쿠폰 필터">
          <button type="button" className={`tab-filter${filter === "available" ? " is-active" : ""}`} onClick={() => setFilter("available")}>사용 가능</button>
          <button type="button" className={`tab-filter${filter === "expiring" ? " is-active" : ""}`} onClick={() => setFilter("expiring")}>만료 예정</button>
          <button type="button" className={`tab-filter${filter === "used" ? " is-active" : ""}`} onClick={() => setFilter("used")}>사용 완료</button>
        </div>
        <div className="coupon-meta-row">
          <span>{filteredCoupons.length}개 쿠폰</span>
          <span>할인 혜택순</span>
        </div>
        {filteredCoupons.length ? (
          <div className="coupon-vault">
            {filteredCoupons.map((item) => (
            <article key={item.id} className={`coupon-vault-item ${getCouponToneClass(item)}`}>
              <div
                className={`coupon-vault-thumb ${getCouponVisualClass(item)}`}
                aria-hidden="true"
              >
                <span className="coupon-vault-stamp">TRIP</span>
              </div>
              <div className="coupon-vault-copy">
                  <div className="payment-row-topline">
                    <span className="coupon-vault-target">{item.target}</span>
                    <span className={`table-code${
                      item.status === "사용 가능"
                        ? " code-available"
                        : item.status === "사용 완료"
                          ? " code-closed"
                          : " code-pending"
                    }`}
                    >
                      {item.status}
                    </span>
                  </div>
                <strong>{item.name}</strong>
                <p>{item.issuedAt} 발급 · {item.expire}</p>
              </div>
              <div className="coupon-vault-side">
                <strong className="coupon-vault-amount">{getCouponAmount(item)}</strong>
                {item.status === "사용 가능" ? (
                  <Link className="coupon-action-button" to="/lodgings">사용하기</Link>
                ) : (
                  <span className="coupon-vault-hint">{item.status === "사용 완료" ? "사용 완료 쿠폰" : "곧 만료되는 쿠폰"}</span>
                )}
              </div>
            </article>
            ))}
          </div>
        ) : (
          <div className="my-empty-inline">
            {filter === "available" ? "사용 가능한 보유 쿠폰이 없어요" : filter === "used" ? "사용 완료 쿠폰이 없어요" : "만료 예정 쿠폰이 없어요"}
          </div>
        )}
      </section>
    </MyPageLayout>
  );
}
