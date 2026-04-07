import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MyPageLayout from "../../components/user/MyPageLayout";
import { toUserFacingErrorMessage } from "../../lib/appClient";
import { formatMembershipGradeLabel, getProfileFieldGroups } from "../../features/mypage/mypageViewModels";
import { clearAuthSession } from "../../utils/authSession";
import {
  changeMyPassword,
  getMyProfileDetails,
  getMyProfileSummary,
  withdrawMyAccount,
} from "../../services/mypageService";

export default function MyProfilePage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { accountInfoRows, accountMetaRows } = getProfileFieldGroups(details);
  const visibleAccountMetaRows = accountMetaRows.filter((item) => item.label === "비밀번호");
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    nextPassword: "",
    confirmPassword: "",
  });
  const [accountActionNotice, setAccountActionNotice] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setIsLoading(true);
        const [nextSummary, nextDetails] = await Promise.all([getMyProfileSummary(), getMyProfileDetails()]);
        if (cancelled) return;
        setSummary(nextSummary);
        setDetails(nextDetails);
      } catch (error) {
        console.error("Failed to load my profile.", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePasswordChange = (key, value) => {
    setPasswordForm((current) => ({ ...current, [key]: value }));
  };

  const handlePasswordSave = async () => {
    if (!passwordForm.nextPassword.trim()) {
      setAccountActionNotice("새 비밀번호를 입력해 주세요.");
      return;
    }

    if (passwordForm.nextPassword.length < 8) {
      setAccountActionNotice("비밀번호는 8자 이상으로 입력해 주세요.");
      return;
    }

    if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
      setAccountActionNotice("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      setIsSavingPassword(true);
      await changeMyPassword(passwordForm.nextPassword, passwordForm.confirmPassword);
      setAccountActionNotice("비밀번호를 변경했습니다.");
      setIsPasswordEditing(false);
      setPasswordForm({ nextPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Failed to change password.", error);
      setAccountActionNotice(toUserFacingErrorMessage(error, "비밀번호를 변경하지 못했습니다."));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setIsWithdrawing(true);
      await withdrawMyAccount();
      clearAuthSession();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Failed to withdraw account.", error);
      setAccountActionNotice(toUserFacingErrorMessage(error, "회원 탈퇴를 처리하지 못했습니다."));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleLogoutAll = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <MyPageLayout>
      <section className="my-list-sheet profile-sheet profile-sheet-v2">
        {isLoading ? (
          <div className="my-empty-panel">
            <strong>회원 정보를 불러오는 중입니다.</strong>
            <p>프로필 요약과 계정 정보를 동기화하고 있습니다.</p>
          </div>
        ) : null}
        <div className="mypage-section-top">
          <strong>내 정보 관리</strong>
        </div>
        <section className="profile-form-section">
          <div className="profile-form-head">
            <div>
              <strong>회원 정보</strong>
              <p>현재 정보 수정은 앱에서 가능해요.</p>
            </div>
          </div>
          <div className="mypage-guide-banner">
            <span>가려진 내 정보를 확인할 수 있어요!</span>
          </div>
          <section className="profile-summary-note">
            <span>{summary?.status ?? "회원 상태 확인 중"}</span>
            <span>{summary?.grade ? formatMembershipGradeLabel(summary.grade) : "등급 확인 중"}</span>
            <span>{summary?.joinedAt ?? "가입일 확인 중"}</span>
            {accountActionNotice ? <span>{accountActionNotice}</span> : null}
          </section>
          <div className="profile-form-grid">
            {accountInfoRows.map((item) => (
              <div key={item.label} className="profile-form-field">
                <span>{item.label}</span>
                <input value={item.value ?? ""} readOnly />
              </div>
            ))}
            {visibleAccountMetaRows.map((item) => (
              <div key={item.label} className="profile-form-meta-cell">
                <div className={`profile-form-field${item.label === "비밀번호" ? " is-password" : ""}`}>
                  <span>{item.label}</span>
                  <div className="profile-form-input-wrap">
                    <input value={item.value ?? ""} readOnly />
                    {item.label === "비밀번호" ? (
                      <button
                        type="button"
                        className="profile-inline-edit-button"
                        aria-label="비밀번호 변경"
                        onClick={() => {
                          setIsPasswordEditing((current) => !current);
                          setAccountActionNotice("");
                        }}
                      >
                        <span aria-hidden="true">✎</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {isPasswordEditing ? (
              <div className="profile-password-panel profile-password-panel-inline">
                <div className="profile-password-head">
                  <strong>비밀번호 변경</strong>
                  <p>새 비밀번호와 확인 값을 입력하면 바로 저장됩니다.</p>
                </div>
                <div className="profile-password-grid">
                  <label className="profile-form-field">
                    <span>새 비밀번호</span>
                    <input
                      type="password"
                      value={passwordForm.nextPassword}
                      onChange={(event) => handlePasswordChange("nextPassword", event.target.value)}
                      placeholder="8자 이상 입력"
                    />
                  </label>
                  <label className="profile-form-field">
                    <span>비밀번호 확인</span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) => handlePasswordChange("confirmPassword", event.target.value)}
                      placeholder="비밀번호 다시 입력"
                    />
                  </label>
                </div>
                <div className="profile-password-actions">
                  <button type="button" className="coupon-action-button" onClick={handlePasswordSave} disabled={isSavingPassword}>
                    {isSavingPassword ? "저장 중..." : "변경 저장"}
                  </button>
                  <button
                    type="button"
                    className="ghost-action-button"
                    onClick={() => {
                      setIsPasswordEditing(false);
                      setAccountActionNotice("");
                      setPasswordForm({ nextPassword: "", confirmPassword: "" });
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
        <section className="profile-device-strip">
          <div>
            <strong>세션 종료</strong>
            <p>현재 기기 로그인 세션만 종료합니다.</p>
          </div>
          <button type="button" className="coupon-action-button" onClick={handleLogoutAll}>로그아웃</button>
        </section>
        <section className="profile-exit-row">
          <span>회원 탈퇴를 진행하면 현재 계정 세션이 종료됩니다.</span>
          <button type="button" className="profile-withdraw-link" onClick={handleWithdraw} disabled={isWithdrawing}>
            {isWithdrawing ? "처리 중..." : "회원탈퇴"}
          </button>
        </section>
      </section>
    </MyPageLayout>
  );
}
