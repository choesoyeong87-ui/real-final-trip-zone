import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { myBookingRows, paymentHistoryRows } from "../../data/siteData";

function makeBookingId(item) {
  return `${item.lodgingId}-${item.stay.replace(/\./g, "").replace(/\s/g, "")}`;
}

export default function MyPaymentsPage() {
  const paidCount = paymentHistoryRows.filter((item) => item.status === "PAID").length;
  const refundedCount = paymentHistoryRows.filter((item) => item.status === "REFUNDED").length;

  return (
    <MyPageLayout>
      <section className="my-list-sheet account-sheet payment-sheet payment-sheet-v2">
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>결제 내역</strong>
            <p>결제수단, 결제일, 환불 상태를 최신순으로 확인합니다.</p>
          </div>
        </div>
        <div className="payment-summary-bar">
          <span>결제 완료 {paidCount}건</span>
          <span>환불 {refundedCount}건</span>
          <Link className="coupon-action-button" to="/my/bookings">예약 보기</Link>
        </div>
        <div className="payment-glance-strip">
          <div className="payment-glance-card is-mint">
            <span>최근 결제</span>
            <strong>{paymentHistoryRows.find((item) => item.status === "PAID")?.amount ?? "-"}</strong>
          </div>
          <div className="payment-glance-card is-soft">
            <span>최근 환불</span>
            <strong>{paymentHistoryRows.find((item) => item.status === "REFUNDED")?.amount ?? "-"}</strong>
          </div>
        </div>
        <div className="payment-row-list">
          {paymentHistoryRows.map((item) => (
            <article key={item.bookingNo} className="payment-row">
              <div className="payment-row-main">
                <div className="payment-row-copy">
                  <div className="payment-row-topline">
                    <span className={`table-code code-${item.status.toLowerCase()}`}>
                      {item.status === "PAID" ? "결제 완료" : "환불"}
                    </span>
                    <span>{item.bookingNo}</span>
                  </div>
                  <strong>{item.lodgingName}</strong>
                  <p>{item.detail}</p>
                </div>
              </div>
              <div className="payment-row-side">
                <strong className={`payment-row-amount${item.status === "REFUNDED" ? " is-refund" : ""}`}>{item.amount}</strong>
                {(() => {
                  const booking = myBookingRows.find((row) => row.name === item.lodgingName);
                  return booking ? (
                    <Link className="coupon-action-button payment-action-button" to={`/my/bookings/${makeBookingId(booking)}`}>
                      결제 상세
                    </Link>
                  ) : null;
                })()}
              </div>
            </article>
          ))}
        </div>
      </section>
    </MyPageLayout>
  );
}
