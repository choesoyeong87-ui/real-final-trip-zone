import {
  couponRows,
  myBookingRows,
  myProfileDetails,
  myProfileSummary,
  paymentHistoryRows,
  wishlistRows,
} from "../data/mypageData";
import {
  createMyInquiryThread,
  deleteMyInquiryThread,
  findMyInquiryThread,
  readMyInquiryThreads,
  updateMyInquiryThread,
} from "../utils/myInquiryCenter";

// Current backend note:
// Booking/payment can adapt to current backend DTOs.
// Inquiry must keep design-doc target shape first:
// InquiryRoom + InquiryMessage, OPEN/ANSWERED/CLOSED/BLOCKED.

export function getMyProfileSummary() {
  return myProfileSummary;
}

export function getMyProfileDetails() {
  return myProfileDetails;
}

export function getMyBookings() {
  return myBookingRows;
}

export function getMyBookingById(bookingId) {
  return myBookingRows.find((item) => String(item.bookingId) === String(bookingId)) ?? null;
}

export function getMyPayments() {
  return paymentHistoryRows;
}

export function getMyPaymentByBookingId(bookingId) {
  return paymentHistoryRows.find((item) => String(item.bookingId) === String(bookingId)) ?? null;
}

export function getMyCoupons() {
  return couponRows;
}

export function getMyWishlist() {
  return wishlistRows;
}

export function getMyInquiryThreads() {
  return readMyInquiryThreads();
}

export function getMyInquiryThreadById(threadId) {
  return findMyInquiryThread(threadId);
}

export function createInquiryThread(payload) {
  return createMyInquiryThread(payload);
}

export function updateInquiryThread(threadId, payload) {
  return updateMyInquiryThread(threadId, payload);
}

export function removeInquiryThread(threadId) {
  return deleteMyInquiryThread(threadId);
}
