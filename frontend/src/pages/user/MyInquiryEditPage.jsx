import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import {
  buildInquiryEditForm,
  INQUIRY_TYPE_OPTIONS,
} from "../../features/mypage/mypageViewModels";
import { getMyInquiryThreadById, updateInquiryThread } from "../../services/mypageService";

export default function MyInquiryEditPage() {
  const { inquiryId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadThread() {
      try {
        const thread = await getMyInquiryThreadById(inquiryId);
        if (!thread || cancelled) return;
        setForm(buildInquiryEditForm(thread));
      } catch (loadError) {
        if (cancelled) return;
        console.error("Failed to load inquiry form.", loadError);
      }
    }

    loadThread();

    return () => {
      cancelled = true;
    };
  }, [inquiryId]);

  if (!form) {
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

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError("");
      await updateInquiryThread(inquiryId, form);
      navigate(`/my/inquiries/${inquiryId}`);
    } catch (submitError) {
      console.error("Failed to update inquiry.", submitError);
      setError("문의 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MyPageLayout>
      <form className="inquiry-form-sheet inquiry-form-sheet-v2" onSubmit={handleSubmit}>
        <div className="mypage-header-row">
          <div className="mypage-header-copy">
            <strong>관리자 문의 수정</strong>
            <p>운영팀이 확인할 제목과 내용을 다시 정리합니다.</p>
          </div>
        </div>
        <div className="mypage-guide-banner">
          <span>제목, 유형, 내용과 함께 예약번호 및 관련 숙소 정보도 수정할 수 있습니다.</span>
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
            {isSubmitting ? "수정 중..." : "수정 완료"}
          </button>
          <Link className="text-link" to={`/my/inquiries/${inquiryId}`}>취소</Link>
        </div>
      </form>
    </MyPageLayout>
  );
}
