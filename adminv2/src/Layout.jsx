import { Link, Outlet, useLocation } from "react-router-dom";
import { 
  Home, Users, ChefHat, MapPin, Menu, X, LogOut, Star, Share, 
  Package, ShoppingCart, Calendar, UserPlus, Building2, 
  Tag, Gift, MessageSquare, ClipboardList, CreditCard 
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";

function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Daily Meals', href: '/daily-meals', icon: Calendar },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Menu Management', href: '/menu', icon: ChefHat },
    { name: 'Vendor Assignment', href: '/vendor-assignment', icon: UserPlus },
    { name: 'Location Zones', href: '/location-zone', icon: MapPin },
    { name: 'Subscriptions', href: '/subscriptions', icon: Package },
    { name: 'Purchases', href: '/purchases', icon: CreditCard },
    { name: 'User Management', href: '/user-management', icon: Users },
    { name: 'Vendor Management', href: '/vendor-management', icon: Building2 },
    { name: "Promo Codes", href: '/promo-codes', icon: Tag },
    { name: 'Referrals', href: '/referrals', icon: Gift },
    { name: 'Reviews', href: '/reviews', icon: MessageSquare },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex w-screen h-screen bg-gray-900">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-gray-800 text-orange-400 hover:bg-gray-700 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-800 to-gray-900 
        border-r border-gray-700 p-6 flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Tiffix
          </h2>
          <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
        </div>
        
        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link 
                key={item.name}
                to={item.href} 
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200
                  ${active 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-gray-700 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{user?.name || 'Admin User'}</p>
              <p className="text-gray-400 text-xs">{user?.email || 'admin@tiffix.com'}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-900 md:ml-0 min-h-screen">
        <div className="h-full overflow-y-auto">
          <div className="min-h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
