import { Routes, Route } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./Layout";
import VendorLayout from "./VendorLayout";

// Admin Components
import Login from "./pages/Admin/Login";
import Menu from "./pages/Admin/Menu";
import LocationZone from "./pages/Admin/LocationZone";
import Subscription from "./pages/Admin/Subscription";
import Vendor from "./pages/Admin/Vendor";
import UserManagement from "./pages/Admin/UserManagement";
import Customers from "./pages/Vendor/Customers";
import VendorAssignment from "./pages/Admin/VendorAssignment";
import Purchases from "./pages/Admin/Purchases";
import Orders from "./pages/Vendor/Orders";
import DailyMeal from "./pages/Admin/DailyMeal";
import PromoCodes from "./pages/Admin/PromoCodes";
import Referals from "./pages/Admin/Referals";
import Order from "./pages/Admin/Order";
import Reviews from "./pages/Admin/Reviews";
import ReviewsVendor from "./pages/Vendor/Reviews";
import Profile from "./pages/Vendor/Profile";
import Dashboard from "./pages/Admin/Dashboard";
import Analytics from "./pages/Admin/Analytics";
import Complain from "./pages/Admin/Complain";



function App() {
  return (
    <AuthProvider>
      <div className="">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/location-zone" element={<LocationZone />} />
            <Route path="/subscriptions" element={<Subscription />} />
            <Route path="/vendor-management" element={<Vendor />} />
            <Route path="/vendor-assignment" element={<VendorAssignment />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/daily-meals" element={<DailyMeal />} />
            <Route path="/orders" element={<Order />} />
            <Route path="/promo-codes" element={<PromoCodes />} />
            <Route path="/referrals" element={<Referals />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/complain" element={<Complain />} />
          </Route>

          {/* Vendor Routes */}
          <Route element={
            <ProtectedRoute requiredRole="vendor">
              <VendorLayout />
            </ProtectedRoute>
          }>
            <Route path="/vendor" element={<Profile />} />
            <Route path="/vendor/orders" element={<Orders />} />
            <Route path="/vendor/reviews" element={<ReviewsVendor />} />
            <Route path="/vendor/customers" element={<Customers />} />
          </Route>
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
