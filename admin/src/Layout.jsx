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
    { name: 'Analytics', href: '/analytics', icon: ClipboardList },
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
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-black/90 backdrop-blur-sm text-orange-400 hover:bg-orange-500/20 transition-colors shadow-lg border border-orange-500/30"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-black backdrop-blur-xl
        border-r border-orange-500/30 flex flex-col transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1.5 rounded-md text-orange-400 hover:text-white hover:bg-orange-500/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Logo */}
        <div className="px-4 py-5 border-b border-orange-500/30">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
            Tiffix
          </h2>
          <p className="text-white text-xs mt-0.5">Admin Panel</p>
        </div>
        
        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link 
                  key={item.name}
                  to={item.href} 
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                    ${active 
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                      : 'text-white hover:text-orange-400 hover:bg-orange-500/20'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-orange-400' : 'text-orange-500 group-hover:text-orange-400'}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-orange-500/30">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-black text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{user?.name || 'Admin User'}</p>
              <p className="text-orange-300 text-xs truncate">{user?.email || 'admin@tiffix.com'}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white hover:text-orange-400 hover:bg-orange-500/20 transition-colors group"
          >
            <LogOut className="w-4 h-4 text-orange-500 group-hover:text-orange-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full bg-black">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;