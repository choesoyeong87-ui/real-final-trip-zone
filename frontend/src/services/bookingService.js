import {
  bookingChecklist,
  bookingCouponOptions,
  bookingPaymentOptions,
  bookingStatusNotes,
} from "../data/bookingData";

// Current backend note:
// /api/booking, bookingNo, roomNo, userCouponNo.
// Convert backend DTOs to bookingId, roomId, userCouponId shape in this service.

export function getBookingChecklist() {
  return bookingChecklist;
}

export function getBookingCouponOptions() {
  return bookingCouponOptions;
}

export function getBookingPaymentOptions() {
  return bookingPaymentOptions;
}

export function getBookingStatusNotes() {
  return bookingStatusNotes;
}
