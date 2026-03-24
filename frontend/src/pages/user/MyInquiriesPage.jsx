import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { readMyInquiryThreads } from "../../utils/myInquiryCenter";

const STATUS_LABELS = {
  OPEN: "접수",
  ANSWERED: "답변 완료",
  CLOSED: "종료",
  BLOCKED: "차단",
};

const TYPE_LABELS = {
  LODGING: "숙소 문의",
  BOOKING: "예약 문의",
  PAYMENT: "결제 문의",
  SYSTEM: "시스템 문의",
};

export default function MyInquiriesPage() {
  const [rows, setRows] = useState([]);
  const answeredCount = rows.filter((item) => item.status === "ANSWERED").length;

  useEffect(() => {
    setRows(readMyInquiryThreads());
  }, []);

  return (
    <MyPageLayout>
      <section className="my-list-sheet inquiry-sheet inquiry-sheet--list">
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>문의센터</strong>
            <p>도움 정보와 내 문의를 분리해서 확인합니다.</p>
          </div>
        </div>
        <div className="support-center-strip support-center-strip--hero">
          <div className="support-center-item">
            <span>운영 시간</span>
            <strong>매일 09:00 - 18:00</strong>
          </div>
          <div className="support-center-item">
            <span>답변 기준</span>
            <strong>일반 문의 24시간 이내</strong>
          </div>
          <div className="support-center-item">
            <span>처리 방식</span>
            <strong>접수 → 확인 → 답변 완료</strong>
          </div>
        </div>
        <div className="support-quick-grid">
          <Link className="support-quick-card" to="/my/inquiries/new">
            <div className="support-quick-main">
              <span className="support-quick-eyebrow">새 문의</span>
              <strong>문의 등록</strong>
              <span>예약, 결제, 숙소 문의 접수</span>
            </div>
            <span className="support-quick-cta">바로 문의하기</span>
          </Link>
          <Link className="support-quick-card" to="/my/inquiries/new?type=BOOKING">
            <div className="support-quick-main">
              <span className="support-quick-eyebrow">예약 도움</span>
              <strong>취소 규정</strong>
              <span>무료 취소와 환불 시점 확인</span>
            </div>
            <span className="support-quick-cta">규정 문의하기</span>
          </Link>
          <Link className="support-quick-card" to="/my/inquiries/new?type=LODGING">
            <div className="support-quick-main">
              <span className="support-quick-eyebrow">숙소 도움</span>
              <strong>체크인 문의</strong>
              <span>입실 시간, 요청사항 안내</span>
            </div>
            <span className="support-quick-cta">요청사항 남기기</span>
          </Link>
        </div>
        <div className="support-history-head">
          <strong>내 문의 내역</strong>
          <span>답변 완료 {answeredCount}건</span>
        </div>
        <div className="payment-row-list inquiry-center-list">
          {rows.map((item) => (
            <article key={item.id} className="payment-row inquiry-center-row">
              <div className="payment-row-main">
                <div className="payment-row-copy inquiry-list-main">
                  <div className="payment-row-topline">
                    <span className="inquiry-list-type">{TYPE_LABELS[item.type] ?? item.type}</span>
                    <span className={`table-code code-${item.status.toLowerCase()}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                    <span>{item.bookingNo}</span>
                  </div>
                  <Link className="inquiry-title-link" to={`/my/inquiries/${item.id}`}>
                    {item.title}
                  </Link>
                  <p>{item.lodging} · {item.updatedAt}</p>
                </div>
              </div>
              <div className="payment-row-side inquiry-center-side">
                <Link className="coupon-action-button payment-action-button" to={`/my/inquiries/${item.id}`}>
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
