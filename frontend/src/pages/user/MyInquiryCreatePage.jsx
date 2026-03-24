import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { createMyInquiryThread } from "../../utils/myInquiryCenter";

const DEFAULT_FORM = {
  title: "",
  type: "LODGING",
  lodging: "",
  bookingNo: "",
  body: "",
};

const TYPE_OPTIONS = [
  { value: "LODGING", label: "숙소 문의", hint: "입실, 시설, 객실 상태" },
  { value: "BOOKING", label: "예약 문의", hint: "일정 변경, 인원, 요청사항" },
  { value: "PAYMENT", label: "결제 문의", hint: "결제 오류, 환불, 영수증" },
  { value: "SYSTEM", label: "서비스 문의", hint: "로그인, 오류, 계정 문제" },
];

export default function MyInquiryCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type");
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    type: TYPE_OPTIONS.some((option) => option.value === initialType) ? initialType : DEFAULT_FORM.type,
  });

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    createMyInquiryThread(form);
    navigate("/my/inquiries");
  };

  return (
    <MyPageLayout>
      <form className="inquiry-form-sheet inquiry-form-sheet-v2" onSubmit={handleSubmit}>
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>문의 등록</strong>
            <p>문의 유형과 예약 정보를 남기면 문의센터 목록으로 돌아갑니다.</p>
          </div>
        </div>
        <div className="mypage-guide-banner">
          <span>예약번호를 같이 남기면 답변이 더 빨라집니다.</span>
        </div>
        <div className="inquiry-form-grid">
          <label className="field-block inquiry-field-full">
            <span>문의 제목</span>
            <input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
          </label>
          <div className="field-block inquiry-field-full">
            <span>문의 유형</span>
            <div className="inquiry-type-grid" role="radiogroup" aria-label="문의 유형">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`inquiry-type-card${form.type === option.value ? " is-active" : ""}`}
                  onClick={() => handleChange("type", option.value)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </button>
              ))}
            </div>
          </div>
          <label className="field-block">
            <span>관련 예약번호</span>
            <input value={form.bookingNo} onChange={(e) => handleChange("bookingNo", e.target.value)} placeholder="예: B-24032" />
          </label>
          <label className="field-block inquiry-field-full">
            <span>관련 숙소</span>
            <input value={form.lodging} onChange={(e) => handleChange("lodging", e.target.value)} placeholder="예: 해운대 오션 스테이" />
          </label>
          <label className="field-block inquiry-field-full">
            <span>문의 내용</span>
            <textarea value={form.body} onChange={(e) => handleChange("body", e.target.value)} required rows={8} />
          </label>
        </div>
        <div className="inquiry-action-bar">
          <button type="submit" className="coupon-action-button inquiry-submit-link">등록 완료</button>
          <Link className="text-link" to="/my/inquiries">취소</Link>
        </div>
      </form>
    </MyPageLayout>
  );
}
