import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import DashboardPage from "../pages/DashboardPage";
import LibraryPage from "../pages/LibraryPage";
import BookDetailPage from "../pages/BookDetailPage";
import WishlistPage from "../pages/WishlistPage";
import ExplorePage from "../pages/ExplorePage";
import KnowledgePage from "../pages/KnowledgePage";
import StatsPage from "../pages/StatsPage";

import AppLayout from "../components/layout/AppLayout";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/books/:id" element={<BookDetailPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/explore" element={<ExplorePage />} />
      </Route>

      {/* Default + unknown routes */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
