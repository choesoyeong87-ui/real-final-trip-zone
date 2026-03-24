import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import HomePage from "../pages/common/HomePage";
import DocsPage from "../pages/common/DocsPage";
import RolesPage from "../pages/common/RolesPage";
import LoginPage from "../pages/common/LoginPage";
import SignupPage from "../pages/common/SignupPage";
import FindIdPage from "../pages/common/FindIdPage";
import FindPasswordPage from "../pages/common/FindPasswordPage";
import EventsPage from "../pages/common/EventsPage";
import LodgingListPage from "../pages/user/LodgingListPage";
import LodgingDetailPage from "../pages/user/LodgingDetailPage";
import BookingPage from "../pages/user/BookingPage";
import MyProfilePage from "../pages/user/MyProfilePage";
import MyBookingsPage from "../pages/user/MyBookingsPage";
import MyBookingDetailPage from "../pages/user/MyBookingDetailPage";
import MyInquiriesPage from "../pages/user/MyInquiriesPage";
import MyWishlistPage from "../pages/user/MyWishlistPage";
import MyCouponsPage from "../pages/user/MyCouponsPage";
import MyMileagePage from "../pages/user/MyMileagePage";
import MyPaymentsPage from "../pages/user/MyPaymentsPage";
import MyInquiryCreatePage from "../pages/user/MyInquiryCreatePage";
import MyInquiryDetailPage from "../pages/user/MyInquiryDetailPage";
import MyInquiryEditPage from "../pages/user/MyInquiryEditPage";
import SellerDashboardPage from "../pages/seller/SellerDashboardPage";
import SellerApplyPage from "../pages/seller/SellerApplyPage";
import SellerLodgingsPage from "../pages/seller/SellerLodgingsPage";
import SellerRoomsPage from "../pages/seller/SellerRoomsPage";
import SellerAssetsPage from "../pages/seller/SellerAssetsPage";
import SellerReservationsPage from "../pages/seller/SellerReservationsPage";
import SellerInquiriesPage from "../pages/seller/SellerInquiriesPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminSellersPage from "../pages/admin/AdminSellersPage";
import AdminEventsPage from "../pages/admin/AdminEventsPage";
import AdminInquiriesPage from "../pages/admin/AdminInquiriesPage";
import AdminReviewsPage from "../pages/admin/AdminReviewsPage";
import AdminAuditLogsPage from "../pages/admin/AdminAuditLogsPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/find-id" element={<FindIdPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/lodgings" element={<LodgingListPage />} />
          <Route path="/lodgings/:lodgingId" element={<LodgingDetailPage />} />
          <Route path="/booking/:lodgingId" element={<BookingPage />} />
          <Route path="/my" element={<Navigate to="/my/profile" replace />} />
          <Route path="/my/profile" element={<MyProfilePage />} />
          <Route path="/my/bookings" element={<MyBookingsPage />} />
          <Route path="/my/bookings/:bookingId" element={<MyBookingDetailPage />} />
          <Route path="/my/inquiries" element={<MyInquiriesPage />} />
          <Route path="/my/inquiries/new" element={<MyInquiryCreatePage />} />
          <Route path="/my/inquiries/:inquiryId" element={<MyInquiryDetailPage />} />
          <Route path="/my/inquiries/:inquiryId/edit" element={<MyInquiryEditPage />} />
          <Route path="/my/wishlist" element={<MyWishlistPage />} />
          <Route path="/my/coupons" element={<MyCouponsPage />} />
          <Route path="/my/mileage" element={<MyMileagePage />} />
          <Route path="/my/payments" element={<MyPaymentsPage />} />
          <Route path="/seller" element={<SellerDashboardPage />} />
          <Route path="/seller/apply" element={<SellerApplyPage />} />
          <Route path="/seller/lodgings" element={<SellerLodgingsPage />} />
          <Route path="/seller/rooms" element={<SellerRoomsPage />} />
          <Route path="/seller/assets" element={<SellerAssetsPage />} />
          <Route path="/seller/reservations" element={<SellerReservationsPage />} />
          <Route path="/seller/inquiries" element={<SellerInquiriesPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/sellers" element={<AdminSellersPage />} />
          <Route path="/admin/events" element={<AdminEventsPage />} />
          <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
          <Route path="/admin/reviews" element={<AdminReviewsPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
