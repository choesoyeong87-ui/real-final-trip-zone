import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { lodgings, wishlistRows } from "../../data/siteData";

const lodgingMap = Object.fromEntries(lodgings.map((lodging) => [lodging.id, lodging]));

export default function MyWishlistPage() {
  return (
    <MyPageLayout>
      <section className="my-list-sheet wishlist-sheet wishlist-sheet-v2">
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>찜 목록</strong>
            <p>찜한 숙소에서 바로 상세 페이지로 이동합니다.</p>
          </div>
          <span className="my-stat-pill">숙소 {wishlistRows.length}개</span>
        </div>
        <div className="wishlist-list booking-list-rows--flush">
          {wishlistRows.map((item) => (
            <article key={item.name} className="wishlist-row">
              <Link className="wishlist-media" to={`/lodgings/${item.lodgingId}`}>
                <img src={lodgingMap[item.lodgingId]?.image} alt={item.name} />
              </Link>
              <div className="wishlist-main">
                <div className="wishlist-copy">
                  <div className="payment-row-topline">
                    <span className="inline-chip">{item.status}</span>
                    <span className="wishlist-region">{lodgingMap[item.lodgingId]?.region} · {lodgingMap[item.lodgingId]?.district}</span>
                  </div>
                  <strong>{item.name}</strong>
                  <p>{lodgingMap[item.lodgingId]?.type} · {lodgingMap[item.lodgingId]?.room}</p>
                </div>
              </div>
              <div className="wishlist-side">
                <span className="wishlist-side-meta">찜한 숙소</span>
                <Link className="coupon-action-button" to={`/lodgings/${item.lodgingId}`}>
                  상세보기
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

    </MyPageLayout>
  );
}
