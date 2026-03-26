import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  INQUIRY_STATUS_LABELS,
  INQUIRY_TYPE_LABELS,
} from "../../features/mypage/mypageViewModels";
import { getMyInquiryThreadById, removeInquiryThread } from "../../services/mypageService";

export default function MyInquiryDetailPage() {
  const { inquiryId } = useParams();
  const navigate = useNavigate();
  const [thread, setThread] = useState(null);

  useEffect(() => {
    setThread(getMyInquiryThreadById(inquiryId));
  }, [inquiryId]);

  if (!thread) {
    return (
      <MyPageLayout>
        <section className="my-list-sheet">
          <div className="my-empty-state">
            <strong>문의 정보를 찾을 수 없습니다.</strong>
          </div>
        </section>
      </MyPageLayout>
    );
  }

  const handleDelete = () => {
    removeInquiryThread(thread.id);
    navigate("/my/inquiries");
  };

  return (
    <MyPageLayout>
      <section className="my-detail-sheet inquiry-thread-panel inquiry-thread-panel-v2">
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>문의 상세</strong>
            <p>문의 상태와 대화 흐름을 시간순으로 확인합니다.</p>
          </div>
        </div>
        <div className="support-center-strip support-center-strip--hero">
          <div className="support-center-item">
            <span>문의 유형</span>
            <strong>{INQUIRY_TYPE_LABELS[thread.type] ?? thread.type}</strong>
          </div>
          <div className="support-center-item">
            <span>상태</span>
            <strong>{INQUIRY_STATUS_LABELS[thread.status] ?? thread.status}</strong>
          </div>
          <div className="support-center-item">
            <span>예약번호</span>
            <strong>{thread.bookingNo}</strong>
          </div>
        </div>
        <div className="inquiry-thread-head inquiry-thread-head-v2">
          <div className="inquiry-thread-copy">
            <strong>{thread.title}</strong>
            <p>{INQUIRY_TYPE_LABELS[thread.type] ?? thread.type} · {thread.lodging} · {thread.bookingNo}</p>
          </div>
          <span className="my-stat-pill is-soft">{thread.updatedAt}</span>
        </div>

        <div className="inquiry-thread-list">
          {thread.messages.map((message) => (
            <article
              key={`${thread.id}-${message.id}`}
              className={`inquiry-message${message.sender === "회원" ? " is-user" : " is-operator"}`}
            >
              <div className="inquiry-message-head">
                <strong>{message.sender}</strong>
                <span>{message.time}</span>
              </div>
              <p>{message.body}</p>
            </article>
          ))}
        </div>
        <div className="payment-sheet-links inquiry-detail-links">
          <Link className="coupon-action-button" to={`/my/inquiries/${thread.id}/edit`}>
            수정
          </Link>
          <Link className="text-link" to="/my/inquiries">
            목록
          </Link>
          <button type="button" className="inquiry-danger-link" onClick={handleDelete}>
            삭제
          </button>
        </div>
      </section>
    </MyPageLayout>
  );
}
