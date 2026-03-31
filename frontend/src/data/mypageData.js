export const myPageSections = [
  { title: "내 정보 관리", subtitle: "등급과 회원 정보를 확인하고 수정 흐름을 준비합니다.", href: "/my/profile", icon: "◉", accent: "teal" },
  { title: "판매자 신청", subtitle: "사업자 정보를 제출하고 승인 상태를 확인합니다.", href: "/my/seller-apply", icon: "◈", accent: "blue" },
  { title: "쿠폰 리스트", subtitle: "보유 쿠폰을 최신순으로 확인합니다.", href: "/my/coupons", icon: "✦", accent: "amber" },
  { title: "예약 내역", subtitle: "최신 예약 상태와 후기 작성 흐름을 확인합니다.", href: "/my/bookings", icon: "◻", accent: "teal" },
  { title: "마일리지 내역", subtitle: "보유 마일리지와 적립/사용 내역을 확인합니다.", href: "/my/mileage", icon: "◆", accent: "amber" },
  { title: "위시리스트", subtitle: "찜한 숙소에서 상세 페이지로 바로 이동합니다.", href: "/my/wishlist", icon: "♥", accent: "rose" },
  { title: "결제 내역", subtitle: "숙소 결제와 환불 내역을 최신순으로 봅니다.", href: "/my/payments", icon: "▣", accent: "blue" },
  { title: "문의센터", subtitle: "문의 등록, 상세, 수정, 삭제 흐름을 확인합니다.", href: "/my/inquiries", icon: "◎", accent: "sage" },
];

export const membershipBenefitTiers = [
  {
    grade: "Basic",
    summary: "회원가입 직후 기본 혜택",
    highlights: ["이벤트 쿠폰 다운로드", "특가 숙소 알림", "예약 내역 관리"],
  },
  {
    grade: "Silver",
    summary: "3회 이상 예약 고객 혜택",
    highlights: ["주중 전용 쿠폰 우선 발급", "리뷰 이벤트 추가 응모", "마일리지 적립 우대"],
  },
  {
    grade: "Gold",
    summary: "현재 내 등급",
    highlights: ["월간 전용 쿠폰팩", "인기 숙소 얼리 액세스", "결제 혜택 우선 노출"],
  },
  {
    grade: "Black",
    summary: "상위 등급 회원 전용 혜택",
    highlights: ["시즌 프로모션 선오픈", "프리미엄 객실 특가", "전용 CS 우선 응답"],
  },
];
