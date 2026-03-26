import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  getSellerApplicationDraft,
  getSellerApplicationSteps,
  getSellerApplicationTemplate,
  submitSellerApplication,
} from "../../services/dashboardService";

export default function SellerApplyPage() {
  const initialDraft = getSellerApplicationDraft();
  const [status, setStatus] = useState(initialDraft?.status ?? "PENDING");
  const [form, setForm] = useState({
    businessNo: initialDraft?.businessNo ?? "",
    businessName: initialDraft?.businessName ?? "",
    owner: initialDraft?.owner ?? "",
    account: initialDraft?.account ?? "",
  });
  const sellerApplicationStatus = getSellerApplicationTemplate();
  const sellerApplicationSteps = getSellerApplicationSteps();

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const saved = submitSellerApplication(form);
    setStatus(saved.status);
  };

  return (
    <DashboardLayout role="seller">
      <div className="dash-page-header">
        <div className="dash-page-header-copy">
          <p className="eyebrow">판매자 신청</p>
          <h1>판매자 신청</h1>
          <p>사업자 정보를 제출하고 승인 결과를 확인합니다.</p>
        </div>
      </div>

      {/* ── Status Cards ── */}
      <div className="dash-stat-grid">
        {sellerApplicationStatus.map((item) => (
          <article key={item.label} className="dash-stat-card">
            <span>{item.label}</span>
            <strong>{item.label === "현재 상태" ? (status === "PENDING" ? "승인 대기" : status) : item.display ?? item.value}</strong>
          </article>
        ))}
      </div>

      <div className="dash-grid-two">
        {/* Steps */}
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>진행 단계</h2>
              <p>신청 절차</p>
            </div>
          </div>
          <div className="dash-checklist">
            {sellerApplicationSteps.map((item) => (
              <div key={item} className="dash-check-item">
                <span className="dash-check-dot" />
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Application Form */}
        <section className="dash-content-section" style={{ marginBottom: 0 }}>
          <div className="dash-section-head">
            <div className="dash-section-head-copy">
              <h2>신청서 작성</h2>
              <p>사업자 정보</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div className="dash-field">
              <span>사업자번호</span>
              <input value={form.businessNo} onChange={(e) => handleChange("businessNo", e.target.value)} required />
            </div>
            <div className="dash-field">
              <span>상호명</span>
              <input value={form.businessName} onChange={(e) => handleChange("businessName", e.target.value)} required />
            </div>
            <div className="dash-field">
              <span>대표자명</span>
              <input value={form.owner} onChange={(e) => handleChange("owner", e.target.value)} required />
            </div>
            <div className="dash-field">
              <span>정산 계좌</span>
              <input value={form.account} onChange={(e) => handleChange("account", e.target.value)} placeholder="은행 / 계좌번호" required />
            </div>
            <div className="dash-action-grid">
              <button type="submit" className="dash-action-btn is-primary">신청 제출</button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}
