import { readAuthSession } from "../features/auth/authSession";
import { get, patch, post, put } from "../lib/appClient";
import { getSellerInquiryRooms } from "./sellerInquiryService";

function formatDateLabel(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateTimeLabel(value) {
  if (!value) return "아직 제출 전";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "-";
  return `${numeric.toLocaleString()}원`;
}

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "-";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "-";
  return `${String(start.getMonth() + 1).padStart(2, "0")}.${String(start.getDate()).padStart(2, "0")} - ${String(end.getMonth() + 1).padStart(2, "0")}.${String(end.getDate()).padStart(2, "0")}`;
}

function mapEnabledStatus(enabled) {
  return enabled === "1" || enabled === "true" || enabled === true ? "ACTIVE" : "BLOCKED";
}

function mapInquiryStatus(status) {
  if (status === "COMPLETED") return "ANSWERED";
  if (status === "DELETE") return "CLOSED";
  return "OPEN";
}

function mapAdminUserDto(dto) {
  return {
    id: dto.userNo,
    name: dto.userName ?? `회원 ${dto.userNo}`,
    role: "ROLE_USER",
    status: mapEnabledStatus(dto.enabled),
    email: dto.email ?? "-",
    phone: dto.phone ?? "-",
    grade: dto.gradeName ?? "-",
  };
}

function mapHostProfileDto(dto) {
  return {
    id: dto.hostNo,
    hostNo: dto.hostNo,
    userNo: dto.userNo,
    business: dto.businessName ?? `호스트 ${dto.hostNo}`,
    owner: dto.ownerName ?? "-",
    status: dto.enabled === "0" ? "SUSPENDED" : dto.approvalStatus ?? "PENDING",
    region: "-",
    businessNo: dto.businessNumber ?? "-",
    rejectReason: dto.rejectReason ?? "",
  };
}

function mapEventDto(dto) {
  const status = dto.status ?? "DRAFT";

  return {
    id: dto.eventNo,
    title: dto.title ?? `이벤트 ${dto.eventNo}`,
    status,
    statusLabel:
      status === "ONGOING" ? "노출중" :
      status === "HIDDEN" ? "숨김" :
      status === "ENDED" ? "종료" : "초안",
    target: dto.couponNames?.length ? dto.couponNames.join(", ") : "전체 회원",
    period: formatDateRange(dto.startDate, dto.endDate),
    content: dto.content ?? "",
    startDate: dto.startDate ?? "",
    endDate: dto.endDate ?? "",
  };
}

function mapInquiryDto(dto, comments = []) {
  return {
    id: dto.inquiryNo,
    title: dto.title ?? `문의 ${dto.inquiryNo}`,
    type: dto.inquiryType ?? "SYSTEM",
    status: mapInquiryStatus(dto.status),
    date: formatDateLabel(dto.regDate),
    owner: `회원 ${dto.userNo ?? "-"}`,
    summary: dto.content ?? "",
    messages: [
      {
        id: `inquiry-${dto.inquiryNo}`,
        sender: "회원",
        time: formatDateLabel(dto.regDate),
        body: dto.content ?? "",
      },
      ...comments.map((comment) => ({
        id: `comment-${comment.commentNo}`,
        sender: "운영팀",
        time: "답변 도착",
        body: comment.content ?? "",
      })),
    ],
  };
}

function mapReservationDto(dto) {
  return {
    id: dto.bookingNo,
    no: dto.bookingNo,
    guest: dto.userNo ? `회원 ${dto.userNo}` : "-",
    stay: `${formatDateLabel(dto.checkInDate)} - ${formatDateLabel(dto.checkOutDate)}`,
    status: dto.status ?? "PENDING",
    amount: formatMoney(dto.totalPrice),
    detail: `${dto.lodgingName ?? "숙소 확인"} · ${dto.roomName ?? "객실 확인"}`,
  };
}

function mapSellerLodgingDto(dto) {
  const roomCount = dto.rooms?.reduce((sum, room) => sum + Number(room.roomCount ?? 0), 0) ?? 0;

  return {
    id: dto.lodgingNo,
    name: dto.lodgingName ?? `숙소 ${dto.lodgingNo}`,
    type: dto.lodgingType ?? "-",
    region: dto.region ?? "-",
    status: dto.status ?? "INACTIVE",
    roomCount,
    occupancy: "-",
    inquiryCount: 0,
    uploadFileNames: dto.uploadFileNames ?? [],
    rooms: dto.rooms ?? [],
  };
}

function mapSellerRoomDto(room, lodgingName) {
  return {
    id: room.roomNo,
    name: room.roomName ?? `객실 ${room.roomNo}`,
    type: room.roomType ?? "-",
    lodging: lodgingName,
    status: room.status ?? "UNAVAILABLE",
    capacity: room.maxGuestCount ? `${room.maxGuestCount}인` : "-",
    price: formatMoney(room.pricePerNight),
  };
}

function mapSellerAssetRows(lodging) {
  const images = lodging.uploadFileNames?.length ? lodging.uploadFileNames : [];
  if (!images.length) {
    return [
      {
        id: `${lodging.id}-placeholder`,
        lodgingId: lodging.id,
        lodging: lodging.name,
        type: "대표 이미지",
        order: "1",
        status: "미등록",
        fileName: null,
      },
    ];
  }

  return images.map((fileName, index) => ({
    id: `${lodging.id}-${fileName}`,
    lodgingId: lodging.id,
    lodging: lodging.name,
    type: index === 0 ? "대표 이미지" : "일반 이미지",
    order: String(index + 1),
    status: index === 0 ? "대표 노출" : "일반 노출",
    fileName,
  }));
}

async function getCurrentHostProfile() {
  const session = readAuthSession();
  if (!session?.userNo) return null;

  const hosts = await get("/api/hosts");
  return hosts.find((item) => Number(item.userNo) === Number(session.userNo)) ?? null;
}

export function getDashboardDataSource() {
  return "http";
}

export function getAdminTasks() {
  return [];
}

export function getSellerTasks() {
  return [];
}

export async function getAdminUsers() {
  const response = await get("/api/admin/admin/userlist?page=1&size=100");
  return (response.dtoList ?? []).map(mapAdminUserDto);
}

export async function updateAdminUserStatus(userNo, nextStatus) {
  const response = await patch(`/api/admin/users/${userNo}/status`, {
    status: nextStatus,
  });
  return mapAdminUserDto(response);
}

export async function getAdminSellers() {
  const rows = await get("/api/hosts");
  return rows.map(mapHostProfileDto);
}

export async function updateAdminSellerStatus(hostNo, nextStatus) {
  if (nextStatus === "APPROVED") {
    await patch(`/api/admin/${hostNo}/approve`, {});
  } else if (nextStatus === "REJECTED") {
    await patch(`/api/admin/${hostNo}/reject`, { rejectReason: "관리자 반려 처리" });
  } else if (nextStatus === "SUSPENDED") {
    await put(`/api/hosts/${hostNo}/delete`, {});
  } else if (nextStatus === "ACTIVE") {
    await put(`/api/hosts/${hostNo}/restore`, {});
  } else {
    throw new Error("지원하지 않는 판매자 상태입니다.");
  }

  const rows = await get("/api/hosts");
  return rows.map(mapHostProfileDto);
}

export async function getAdminEvents() {
  const response = await get("/api/event/list?page=1&size=100");
  return (response.dtoList ?? []).map(mapEventDto);
}

export async function updateAdminEventStatus(eventId, nextStatus, currentEvent) {
  const formData = new FormData();
  formData.append("title", currentEvent.title);
  formData.append("content", currentEvent.content ?? "");
  formData.append("startDate", currentEvent.startDate);
  formData.append("endDate", currentEvent.endDate);
  formData.append("status", nextStatus);

  await put(`/api/event/${eventId}`, formData);
  const refreshed = await get(`/api/event/${eventId}`);
  return mapEventDto(refreshed);
}

export async function saveAdminEvent(eventId, draft, currentEvent) {
  const formData = new FormData();
  formData.append("title", draft.title);
  formData.append("content", draft.content ?? currentEvent.content ?? "");
  formData.append("startDate", draft.startDate);
  formData.append("endDate", draft.endDate);
  formData.append("status", currentEvent.status ?? "DRAFT");

  await put(`/api/event/${eventId}`, formData);
  const refreshed = await get(`/api/event/${eventId}`);
  return mapEventDto(refreshed);
}

export async function getAdminInquiries() {
  const [inquiryResponse, commentResponse] = await Promise.all([
    get("/api/inquiry/list?page=1&size=100"),
    get("/api/comment/list?page=1&size=200").catch(() => ({ dtoList: [] })),
  ]);
  const comments = commentResponse.dtoList ?? [];
  return (inquiryResponse.dtoList ?? []).map((dto) =>
    mapInquiryDto(
      dto,
      comments.filter((comment) => Number(comment.inquiryNo) === Number(dto.inquiryNo)),
    ),
  );
}

export async function updateAdminInquiryStatus(inquiryNo, nextStatus) {
  const response = await patch(`/api/admin/inquiries/${inquiryNo}/status`, {
    status: nextStatus,
  });
  return mapInquiryDto(response);
}

export async function getAdminReviews() {
  const rows = await get("/api/reviews/admin");
  return rows.map((review) => ({
    id: review.reviewNo,
    lodging: review.lodgingName ?? `숙소 ${review.lodgingNo}`,
    author: review.userName ?? `회원 ${review.userNo ?? "-"}`,
    score: Number(review.rating ?? 0).toFixed(1),
    status: review.status ?? "VISIBLE",
    report: "0건",
    summary: review.content ?? "",
  }));
}

export async function updateAdminReviewStatus(reviewNo, nextStatus) {
  const response = await patch(`/api/reviews/${reviewNo}/visibility`, {
    status: nextStatus,
  });
  return {
    id: response.reviewNo,
    lodging: response.lodgingName ?? `숙소 ${response.lodgingNo}`,
    author: response.userName ?? `회원 ${response.userNo ?? "-"}`,
    score: Number(response.rating ?? 0).toFixed(1),
    status: response.status ?? nextStatus,
    report: "0건",
    summary: response.content ?? "",
  };
}

export function getAdminAuditLogs() {
  return [];
}

export async function getSellerLodgings() {
  const host = await getCurrentHostProfile();
  if (!host) return [];

  const lodgings = await get("/api/lodgings/list");
  return lodgings
    .filter((item) => Number(item.hostNo) === Number(host.hostNo))
    .map(mapSellerLodgingDto);
}

export async function updateSellerLodgingStatus(lodgingId, nextStatus) {
  const formData = new FormData();
  formData.append("status", nextStatus);
  const response = await patch(`/api/lodgings/${lodgingId}`, formData);
  return mapSellerLodgingDto(response);
}

export async function getSellerReservations() {
  const host = await getCurrentHostProfile();
  if (!host) return [];

  const response = await get(`/api/seller/hostlist/${host.hostNo}?page=1&size=100`);
  return (response.dtoList ?? []).map(mapReservationDto);
}

export async function updateSellerReservationStatus(bookingNo, nextStatus) {
  const response = await patch(`/api/seller/bookings/${bookingNo}/status`, {
    status: nextStatus,
  });
  return mapReservationDto(response);
}

export async function getSellerRooms() {
  const lodgings = await getSellerLodgings();
  return lodgings.flatMap((lodging) =>
    (lodging.rooms ?? []).map((room) => mapSellerRoomDto(room, lodging.name)),
  );
}

export async function updateSellerRoomStatus(roomId, nextStatus, lodgingName) {
  const response = await patch(`/api/rooms/${roomId}`, {
    status: nextStatus,
  });
  return mapSellerRoomDto(response, lodgingName);
}

export async function getSellerAssets() {
  const lodgings = await getSellerLodgings();
  return lodgings.flatMap(mapSellerAssetRows);
}

export async function updateSellerAsset(assetId, patchData) {
  const currentAssets = await getSellerAssets();
  const target = currentAssets.find((item) => item.id === assetId);

  if (!target?.fileName) {
    throw new Error("조정할 이미지가 없습니다.");
  }

  const lodging = await get(`/api/lodgings/${target.lodgingId}`);
  const uploadFileNames = [...(lodging.uploadFileNames ?? [])];
  const currentIndex = uploadFileNames.indexOf(target.fileName);

  if (currentIndex < 0) {
    throw new Error("이미지 파일 정보를 찾을 수 없습니다.");
  }

  uploadFileNames.splice(currentIndex, 1);

  if (patchData.mode === "PRIMARY") {
    uploadFileNames.unshift(target.fileName);
  } else if (patchData.mode === "LAST") {
    uploadFileNames.push(target.fileName);
  } else {
    throw new Error("지원하지 않는 이미지 작업입니다.");
  }

  await patch(`/api/lodgings/${target.lodgingId}`, (() => {
    const formData = new FormData();
    uploadFileNames.forEach((fileName) => formData.append("uploadFileNames", fileName));
    return formData;
  })());

  const refreshedAssets = await getSellerAssets();
  return refreshedAssets.find((item) => item.fileName === target.fileName && item.lodgingId === target.lodgingId) ?? null;
}

export function getSellerApplicationTemplate() {
  return [
    { label: "현재 상태", value: "READY", display: "신청 전", tone: "sand" },
    { label: "서류 접수", value: "READY", display: "신청서 제출 가능", tone: "mint" },
    { label: "정산 계좌", value: "INFO", display: "승인 후 별도 관리", tone: "blue" },
  ];
}

export function getSellerApplicationSteps() {
  return [
    "사업자 정보 등록",
    "대표 숙소 기본 정보 입력",
    "운영 정책과 취소 규정 확인",
    "승인 결과는 판매자센터에서 확인",
  ];
}

export async function getSellerApplicationDraft() {
  const host = await getCurrentHostProfile();
  const submittedAtSource = host?.updDate ?? host?.regDate ?? null;
  return {
    status: host?.approvalStatus ?? "READY",
    businessNo: host?.businessNumber ?? "",
    businessName: host?.businessName ?? "",
    owner: host?.ownerName ?? "",
    account: "",
    submittedAt: submittedAtSource ? formatDateTimeLabel(submittedAtSource) : null,
  };
}

export async function submitSellerApplication(form) {
  const session = readAuthSession();
  if (!session?.userNo) {
    throw new Error("로그인 정보가 없습니다.");
  }

  const payload = {
    userNo: session.userNo,
    businessNumber: form.businessNo.trim(),
    businessName: form.businessName.trim(),
    ownerName: form.owner.trim(),
  };

  const host = await getCurrentHostProfile();

  if (!host) {
    await post("/api/hosts/register", payload);
  } else if (host.approvalStatus === "REJECTED") {
    await patch(`/api/hosts/${host.hostNo}`, payload);
  } else if (host.approvalStatus === "PENDING") {
    throw new Error("이미 승인 대기 중인 신청서가 있습니다.");
  } else if (host.approvalStatus === "APPROVED") {
    throw new Error("이미 승인된 호스트 계정입니다.");
  } else {
    throw new Error("현재 상태에서는 신청서를 다시 제출할 수 없습니다.");
  }

  return getSellerApplicationDraft();
}

export async function getSellerMetrics() {
  const [lodgings, reservations, inquiries] = await Promise.all([
    getSellerLodgings(),
    getSellerReservations(),
    getSellerInquiryRooms().catch(() => []),
  ]);

  return [
    { label: "오늘 체크인", value: String(reservations.filter((item) => item.status === "CONFIRMED").length).padStart(2, "0") },
    { label: "답변 대기 문의", value: String(inquiries.filter((item) => item.status === "OPEN").length).padStart(2, "0") },
    { label: "운영 숙소", value: String(lodgings.filter((item) => item.status === "ACTIVE").length).padStart(2, "0") },
    { label: "가동 객실", value: String(lodgings.reduce((sum, item) => sum + Number(item.roomCount ?? 0), 0)).padStart(2, "0") },
  ];
}

export async function getAdminDashboardSnapshot() {
  const [users, sellers, adminInquiries] = await Promise.all([
    getAdminUsers().catch(() => []),
    getAdminSellers().catch(() => []),
    getAdminInquiries().catch(() => []),
  ]);

  return {
    adminTasks: [],
    adminInquiries,
    auditLogs: [],
    sellers,
    users,
  };
}

export async function getSellerDashboardSnapshot() {
  const [lodgings, reservations, metrics] = await Promise.all([
    getSellerLodgings().catch(() => []),
    getSellerReservations().catch(() => []),
    getSellerMetrics().catch(() => []),
  ]);

  return {
    sellerTasks: [],
    metrics,
    lodgings,
    reservations,
    inquiries: [],
  };
}
