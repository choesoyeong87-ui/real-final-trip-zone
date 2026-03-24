import { Link, useParams } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { lodgings, myBookingRows, paymentHistoryRows } from "../../data/siteData";

const STATUS_LABELS = {
  CONFIRMED: "확정",
  PENDING: "대기",
  COMPLETED: "숙박 완료",
};

function makeBookingId(item) {
  return `${item.lodgingId}-${item.stay.replace(/\./g, "").replace(/\s/g, "")}`;
}

const lodgingMap = Object.fromEntries(lodgings.map((lodging) => [lodging.id, lodging]));

export default function MyBookingDetailPage() {
  const { bookingId } = useParams();
  const booking = myBookingRows.find((item) => makeBookingId(item) === bookingId);

  if (!booking) {
    return <MyPageLayout eyebrow="예약 상세" title="예약 정보를 찾을 수 없습니다." />;
  }

  const lodging = lodgingMap[booking.lodgingId];
  const payment = paymentHistoryRows.find((item) => item.lodgingName === booking.name && item.amount === booking.price);
  const statusLabel = STATUS_LABELS[booking.status] ?? booking.status;

  return (
    <MyPageLayout>
      <section className="my-page-inline-meta">
        <span className={`table-code code-${booking.status.toLowerCase()}`}>{statusLabel}</span>
        <span>주문 정보 {bookingId}</span>
        <span>{payment?.detail ?? "결제 정보 확인 필요"}</span>
      </section>

      <section className="booking-detail-sheet">
        <div className="booking-detail-top">
          <div className="booking-detail-visual">
            <img src={lodging?.image} alt={booking.name} />
          </div>
          <div className="booking-detail-summary">
            <strong>{booking.name}</strong>
            <p>{lodging?.district} · {lodging?.room}</p>
            <div className="booking-detail-price">
              <span>결제 금액</span>
              <strong>{booking.price}</strong>
            </div>
          </div>
        </div>

        <div className="booking-detail-grid">
          <div className="booking-detail-row">
            <span>예약 일정</span>
            <strong>{booking.stay}</strong>
          </div>
          <div className="booking-detail-row">
            <span>예약 상태</span>
            <strong>{statusLabel}</strong>
          </div>
          <div className="booking-detail-row">
            <span>객실 정보</span>
            <strong>{lodging?.room}</strong>
          </div>
          <div className="booking-detail-row">
            <span>위치</span>
            <strong>{lodging?.region} · {lodging?.district}</strong>
          </div>
          <div className="booking-detail-row">
            <span>체크인/체크아웃</span>
            <strong>
              {lodging?.checkInTime} / {lodging?.checkOutTime}
            </strong>
          </div>
          <div className="booking-detail-row">
            <span>취소 규정</span>
            <strong>{lodging?.cancellation}</strong>
          </div>
          <div className="booking-detail-row">
            <span>결제 수단</span>
            <strong>{payment?.detail ?? "결제 정보 없음"}</strong>
          </div>
          <div className="booking-detail-row">
            <span>주문 정보</span>
            <strong>{bookingId}</strong>
          </div>
        </div>
      </section>

      <div className="booking-actions">
        <Link className="secondary-button" to="/my/bookings">
          예약 목록
        </Link>
        <Link className="secondary-button" to={`/lodgings/${booking.lodgingId}`}>
          숙소 상세 보기
        </Link>
        {booking.status === "COMPLETED" ? (
          <Link className="primary-button" to={`/lodgings/${booking.lodgingId}#reviews`}>
            후기 작성
          </Link>
        ) : null}
      </div>
    </MyPageLayout>
  );
}
