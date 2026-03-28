export function buildGalleryImages(image) {
  return [
    image,
    `${image}&sat=-14&contrast=8&crop=entropy`,
    `${image}&exp=8&hue=12&crop=entropy`,
  ];
}

export function getRoomMeta(roomName) {
  if (roomName.includes("조식")) return "조식 포함";
  if (roomName.includes("환불형")) return "무료 취소 가능";
  return "기본 예약";
}

export function getRoomCapacity(roomName) {
  const match = roomName.match(/최대\s*(\d+)인/);
  return match ? `최대 ${match[1]}인` : "기준 2인";
}

export function getRoomTitle(roomName) {
  return roomName.split("·")[0].trim();
}

export function getDiscountRate(price, originalPrice) {
  const current = Number(String(price).replace(/[^\d]/g, ""));
  const original = Number(String(originalPrice).replace(/[^\d]/g, ""));
  if (!current || !original || original <= current) return "";
  return `${Math.round(((original - current) / original) * 100)}%`;
}
