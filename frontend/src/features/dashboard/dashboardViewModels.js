const monthlyOps = [
  { month: "1월", revenue: 1248, bookings: 94 },
  { month: "2월", revenue: 1386, bookings: 102 },
  { month: "3월", revenue: 1654, bookings: 121 },
  { month: "4월", revenue: 1822, bookings: 133 },
  { month: "5월", revenue: 2015, bookings: 146 },
  { month: "6월", revenue: 2243, bookings: 158 },
];

function formatMetricValue(value) {
  return String(value).padStart(2, "0");
}

export function getAdminDashboardViewModel({ users, sellers, adminInquiries, auditLogs, adminTasks }) {
  const blockedUsers = users.filter((item) => item.status === "BLOCKED");
  const dormantUsers = users.filter((item) => item.status === "DORMANT");
  const attentionUsers = [...blockedUsers, ...dormantUsers].slice(0, 2);
  const pendingSellers = sellers.filter((item) => item.status === "PENDING").length;
  const openInquiries = adminInquiries.filter((item) => item.status === "OPEN").length;
  const peakRevenue = Math.max(...monthlyOps.map((item) => item.revenue));
  const totalRevenue = monthlyOps.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = monthlyOps.reduce((sum, item) => sum + item.bookings, 0);
  const canceledBookings = 32;
  const confirmedRate = Math.round((totalBookings / (totalBookings + canceledBookings)) * 100);
  const cancelRate = 100 - confirmedRate;
  const lodgingMix = [
    { label: "호텔", count: 188, revenue: "2,950만", ratio: 29, fill: "100%" },
    { label: "리조트", count: 134, revenue: "2,380만", ratio: 21, fill: "72%" },
    { label: "펜션", count: 156, revenue: "2,010만", ratio: 24, fill: "83%" },
    { label: "한옥", count: 94, revenue: "1,284만", ratio: 15, fill: "50%" },
  ];
  const sellerPerformance = [
    { label: "오션 스테이", revenue: "2,280만", metric: "예약 143건", fill: "100%" },
    { label: "포레스트 하우스", revenue: "1,765만", metric: "예약 114건", fill: "77%" },
    { label: "코스트 라운지", revenue: "1,522만", metric: "예약 98건", fill: "67%" },
  ];
  const reservationMix = [
    { label: "예약 완료", count: `${totalBookings}건`, ratio: `${confirmedRate}%`, fill: `${confirmedRate}%`, tone: "mint" },
    { label: "예약 취소", count: `${canceledBookings}건`, ratio: `${cancelRate}%`, fill: `${cancelRate}%`, tone: "sand" },
  ];

  return {
    header: {
      eyebrow: "관리자센터",
      title: "운영 워크스페이스",
      description: "승인, 회원 상태, 문의 흐름을 한 화면에서 바로 판단하고 처리합니다.",
      spotlight: {
        label: "최근 6개월 누적 매출",
        value: `${totalRevenue}만`,
        note: "예약 흐름과 운영 이슈를 같이 보는 관리자 요약",
      },
      facts: [
        { label: "총 예약 요청", value: `${totalBookings}건` },
        { label: "미처리 문의", value: `${openInquiries}건` },
        { label: "전체 회원", value: `${formatMetricValue(users.length)}명` },
        { label: "전체 판매자", value: `${formatMetricValue(sellers.length)}명` },
      ],
      links: [
        { label: "판매자 승인", to: "/admin/sellers" },
        { label: "회원 관리", to: "/admin/users" },
        { label: "문의 모니터링", to: "/admin/inquiries" },
        { label: "이벤트 · 쿠폰", to: "/admin/events" },
        { label: "리뷰 운영", to: "/admin/reviews" },
      ],
    },
    metrics: [
      { label: "총 매출액", value: `${totalRevenue}만` },
      { label: "총 예약 수", value: `${totalBookings}건` },
      { label: "예약 완료율", value: `${confirmedRate}%` },
      { label: "예약 취소율", value: `${cancelRate}%` },
      { label: "승인 대기 판매자", value: formatMetricValue(pendingSellers) },
      { label: "미답변 문의", value: formatMetricValue(openInquiries) },
    ],
    reservationMix,
    sellerPerformance,
    watchRows: [
      ...sellers.map((item) => ({
        kind: "판매자",
        title: item.business,
        status: item.status,
        meta: `${item.owner} · ${item.region}`,
        to: "/admin/sellers",
      })),
      ...adminInquiries.map((item) => ({
        kind: "문의",
        title: item.title,
        status: item.status,
        meta: `${item.owner} · ${item.type}`,
        to: "/admin/inquiries",
      })),
    ].slice(0, 6),
    logs: auditLogs.map((item) => ({
      title: item.action,
      subtitle: item.actor ?? item.admin,
      target: item.target,
      time: item.time,
    })),
    trends: monthlyOps.map((item) => ({
      label: item.month,
      metric: `${item.revenue}만`,
      meta: `${item.bookings}건`,
      fill: `${(item.revenue / peakRevenue) * 100}%`,
    })),
    monthlyPerformance: monthlyOps.map((item) => ({
      label: item.month,
      revenue: `${item.revenue}만`,
      bookings: `${item.bookings}건`,
      fill: `${(item.revenue / peakRevenue) * 100}%`,
    })),
    lodgingMix,
    attentionUsers: attentionUsers.map((item) => ({
      status: item.status,
      role: item.role,
      name: item.name,
      email: item.email,
    })),
    facts: [
      { label: "차단 회원", value: formatMetricValue(blockedUsers.length) },
      { label: "휴면 회원", value: formatMetricValue(dormantUsers.length) },
    ],
    checklist: adminTasks,
  };
}

export function getSellerDashboardViewModel({ reservations, lodgings, metrics, sellerTasks }) {
  const todayReservations = reservations.slice(0, 4);
  const activeLodgings = lodgings.filter((item) => item.status === "ACTIVE").length;
  const waitingInquiries = metrics.find((item) => item.label === "답변 대기 문의")?.value ?? "00";
  const todayCheckIns = metrics.find((item) => item.label === "오늘 체크인")?.value ?? "00";
  const availableRooms = metrics.find((item) => item.label === "가동 객실")?.value ?? "00";
  const monthlyBookingBars = [
    { label: "이번 주", metric: "14건", meta: "체크인 6건", fill: "68%" },
    { label: "다음 주", metric: "09건", meta: "체크인 4건", fill: "44%" },
    { label: "문의 전환", metric: "72%", meta: "최근 7일", fill: "72%" },
  ];

  return {
    header: {
      eyebrow: "판매자센터",
      title: "운영 워크스페이스",
      description: "오늘 체크인, 답변 대기 문의, 숙소 운영 상태를 바로 확인하고 처리합니다.",
      spotlight: {
        label: "오늘 우선 확인",
        value: `${todayCheckIns}건`,
        note: "체크인 일정과 문의 응답을 먼저 처리하세요.",
      },
      facts: [
        { label: "답변 대기 문의", value: `${waitingInquiries}건` },
        { label: "운영 숙소", value: `${activeLodgings}곳` },
        { label: "가동 객실", value: `${availableRooms}개` },
        { label: "이번 주 예약", value: "14건" },
      ],
      links: [
        { label: "예약 관리", to: "/seller/reservations" },
        { label: "문의 관리", to: "/seller/inquiries" },
        { label: "숙소 관리", to: "/seller/lodgings" },
        { label: "객실 관리", to: "/seller/rooms" },
        { label: "이미지 관리", to: "/seller/assets" },
      ],
    },
    metrics: [
      { label: "오늘 체크인", value: formatMetricValue(todayCheckIns) },
      { label: "답변 대기 문의", value: formatMetricValue(waitingInquiries) },
      { label: "운영 숙소", value: formatMetricValue(activeLodgings) },
      { label: "가동 객실", value: formatMetricValue(availableRooms) },
    ],
    reservationRows: todayReservations.map((item) => ({
      no: item.no,
      guest: item.guest,
      status: item.status,
      detail: `${item.stay} · ${item.amount}`,
      to: "/seller/reservations",
    })),
    lodgingRows: lodgings.map((lodging) => ({
      region: lodging.region,
      name: lodging.name,
      status: lodging.status,
      roomSummary: `객실 ${lodging.roomCount}개`,
      inquirySummary: `문의 ${lodging.inquiryCount}건`,
      occupancy: lodging.occupancy,
      detail: `객실 ${lodging.roomCount}개 · 문의 ${lodging.inquiryCount}건 · 점유율 ${lodging.occupancy}`,
      to: "/seller/lodgings",
    })),
    trends: monthlyBookingBars,
    checklist: sellerTasks,
    quickLinks: [
      { title: "문의 관리", subtitle: "답변 대기 확인", to: "/seller/inquiries" },
      { title: "객실 관리", subtitle: "판매 가능 상태 확인", to: "/seller/rooms" },
      { title: "이미지 관리", subtitle: "대표 이미지 정리", to: "/seller/assets" },
      { title: "판매자 신청", subtitle: "승인 상태 확인", to: "/seller/apply" },
    ],
  };
}
