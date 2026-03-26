export function getBookingLodging(lodgings, lodgingId) {
  return lodgings.find((item) => String(item.id) === lodgingId) ?? lodgings[0];
}

export function buildRoomOptions(lodging) {
  return [lodging.room, `${lodging.room} · 조식 포함`, `${lodging.room} · 환불형`];
}

export function createInitialBookingForm(searchParams, roomOptions, lodging, couponOptions, paymentOptions) {
  const initialRoom = searchParams.get("room");
  const checkIn = searchParams.get("checkIn") ?? "2026-03-28";
  const checkOut = searchParams.get("checkOut") ?? "2026-03-30";
  const guests = Number(searchParams.get("guests") ?? 2);

  return {
    checkIn,
    checkOut,
    guests: Number.isFinite(guests) && guests > 0 ? guests : 2,
    room: roomOptions.includes(initialRoom) ? initialRoom : lodging.room,
    couponLabel: couponOptions[0]?.label ?? "",
    paymentMethod: paymentOptions[0].value,
    request: "",
  };
}

export function getBookingSelections(form, couponOptions, paymentOptions) {
  return {
    selectedCoupon: couponOptions.find((item) => item.label === form.couponLabel) ?? couponOptions[0],
    selectedPayment: paymentOptions.find((item) => item.value === form.paymentMethod) ?? paymentOptions[0],
  };
}

export function buildBookingPricing(lodging, form, selectedCoupon) {
  const baseAmount = Number(String(lodging.price).replace(/[^\d]/g, ""));
  const checkInDate = new Date(form.checkIn);
  const checkOutDate = new Date(form.checkOut);
  const nightCount = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000));
  const serviceFee = 9000;
  const roomTotal = baseAmount * nightCount;
  const totalAmount = Math.max(roomTotal - selectedCoupon.discount + serviceFee, 0);

  return {
    baseAmount,
    nightCount,
    serviceFee,
    roomTotal,
    totalAmount,
  };
}

export function getBookingCtaHref(authSession) {
  return authSession ? "/my/bookings" : "/login";
}
