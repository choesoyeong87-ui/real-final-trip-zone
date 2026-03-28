export const bookingChecklist = [
  "체크인과 체크아웃 날짜 확인",
  "투숙 인원과 요청사항 입력",
  "할인 쿠폰과 적립 혜택 확인",
  "결제 전 취소 규정과 총액 재확인",
];

export const bookingCouponOptions = [
  { label: "쿠폰 미사용", discount: 0 },
  { label: "주말 12,000원 할인", discount: 12000 },
  { label: "제주 연박 10% 할인", discount: 18000 },
];

export const bookingGuestOptions = [1, 2, 3, 4];

export const bookingPaymentOptions = [
  { label: "신용/체크카드", value: "CARD", pg: "KG이니시스" },
  { label: "카카오페이", value: "KAKAOPAY", pg: "카카오페이" },
  { label: "네이버페이", value: "NAVERPAY", pg: "네이버페이" },
  { label: "무통장입금", value: "BANK", pg: "가상계좌" },
];

export const bookingStatusNotes = [
  "예약 정보와 요청사항은 체크인 전까지 마이페이지에서 언제든 수정할 수 있어요.",
  "무료 취소 기간은 숙소마다 달라요. 결제 전에 꼭 한 번 더 확인해 주세요.",
  "예약 후 숙소에 궁금한 점이 있으면 마이페이지 > 문의 내역에서 바로 남길 수 있어요.",
];
