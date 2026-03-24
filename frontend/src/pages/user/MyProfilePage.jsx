import { useNavigate } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { myProfileDetails, myProfileSummary } from "../../data/siteData";
import { clearAuthSession } from "../../utils/authSession";

export default function MyProfilePage() {
  const navigate = useNavigate();
  const accountInfoRows = myProfileDetails.filter((item) => ["이메일", "전화번호", "회원 등급"].includes(item.label));
  const accountMetaRows = myProfileDetails.filter((item) => ["로그인 방식", "마케팅 수신", "최근 로그인"].includes(item.label));

  const handleWithdraw = () => {
    const confirmed = window.confirm("회원 탈퇴를 진행하시겠습니까?");
    if (!confirmed) return;
    clearAuthSession();
    navigate("/");
  };

  const handleLogoutAll = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <MyPageLayout>
      <section className="my-list-sheet profile-sheet profile-sheet-v2">
        <div className="mypage-section-top">
          <strong>내 정보 관리</strong>
        </div>
        <section className="profile-form-section">
          <div className="profile-form-head">
            <div>
              <strong>회원 정보</strong>
              <p>현재 정보 수정은 앱에서 가능해요.</p>
            </div>
            <div className="profile-form-badge" aria-hidden="true" />
          </div>
          <div className="mypage-guide-banner">
            <span>가려진 내 정보를 확인할 수 있어요!</span>
          </div>
          <div className="profile-form-grid">
            {accountInfoRows.map((item) => (
              <label key={item.label} className="profile-form-field">
                <span>{item.label}</span>
                <input value={item.value} readOnly />
              </label>
            ))}
            {accountMetaRows.map((item) => (
              <label key={item.label} className="profile-form-field">
                <span>{item.label}</span>
                <input value={item.value} readOnly />
              </label>
            ))}
          </div>
        </section>
        <section className="profile-summary-note">
          <span>{myProfileSummary.status}</span>
          <span>{myProfileSummary.grade} 등급</span>
          <span>{myProfileSummary.joinedAt}</span>
        </section>
        <section className="profile-device-strip">
          <div>
            <strong>접속 기기 관리</strong>
            <p>로그인 된 모든 기기에서 로그아웃 돼요.</p>
          </div>
          <button type="button" className="coupon-action-button" onClick={handleLogoutAll}>전체 로그아웃</button>
        </section>
        <section className="profile-exit-row">
          <span>더 이상 TripZone 이용을 원하지 않으신가요?</span>
          <button type="button" className="profile-withdraw-link" onClick={handleWithdraw}>
            회원탈퇴
          </button>
        </section>
      </section>
    </MyPageLayout>
  );
}
