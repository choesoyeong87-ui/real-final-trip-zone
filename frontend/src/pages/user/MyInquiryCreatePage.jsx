import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  buildInquiryCreateForm,
  INQUIRY_TYPE_OPTIONS,
} from "../../features/mypage/mypageViewModels";
import { createInquiryThread } from "../../services/mypageService";

export default function MyInquiryCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type");
  const [form, setForm] = useState(buildInquiryCreateForm(initialType));
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");
      await createInquiryThread(form);
      navigate("/my/inquiries");
    } catch (submitError) {
      console.error("Failed to create inquiry.", submitError);
      setError("관리자 문의 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MyPageLayout>
      <form className="inquiry-form-sheet inquiry-form-sheet-v2" onSubmit={handleSubmit}>
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>관리자 문의 등록</strong>
            <p>운영팀이 확인할 이슈를 정리해서 남기면 상세 문의 내역으로 연결됩니다.</p>
          </div>
        </div>
        <div className="mypage-guide-banner">
          <span>운영 문의에 필요한 경우 예약번호와 관련 숙소를 함께 남길 수 있습니다.</span>
        </div>
        {error ? <div className="my-empty-inline">{error}</div> : null}
        <div className="inquiry-form-grid">
          <label className="field-block inquiry-field-full">
            <span>문의 제목</span>
            <input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
          </label>
          <div className="field-block inquiry-field-full">
            <span>문의 유형</span>
            <div className="inquiry-type-grid" role="radiogroup" aria-label="문의 유형">
              {INQUIRY_TYPE_OPTIONS.map((option) => (
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
            <input value={form.bookingNo} onChange={(e) => handleChange("bookingNo", e.target.value)} placeholder="선택 입력" />
          </label>
          <label className="field-block inquiry-field-full">
            <span>관련 숙소</span>
            <input value={form.lodging} onChange={(e) => handleChange("lodging", e.target.value)} placeholder="선택 입력" />
          </label>
          <label className="field-block inquiry-field-full">
            <span>문의 내용</span>
            <textarea value={form.body} onChange={(e) => handleChange("body", e.target.value)} required rows={8} />
          </label>
        </div>
        <div className="inquiry-action-bar">
          <button type="submit" className="coupon-action-button inquiry-submit-link" disabled={isSubmitting}>
            {isSubmitting ? "등록 중..." : "등록 완료"}
          </button>
          <Link className="text-link" to="/my/inquiries">취소</Link>
        </div>
      </form>
    </MyPageLayout>
  );
}
