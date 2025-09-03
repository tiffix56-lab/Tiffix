import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, Package, BarChart3, Settings, Menu, X, LogOut, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";

function VendorLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/vendor', icon: Home },
    { name: 'My Menu', href: '/vendor/menu', icon: Package },
    { name: 'Orders', href: '/vendor/orders', icon: BarChart3 },
    { name: 'Analytics', href: '/vendor/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/vendor/profile', icon: Settings },
    { name: 'Customers', href: '/vendor/customers', icon: Users },
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
          className="p-2 rounded-lg bg-slate-800/90 backdrop-blur-sm text-orange-400 hover:bg-slate-700 transition-colors shadow-lg border border-slate-700/50"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm"
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
          className="md:hidden absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-orange-400 hover:bg-slate-700/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Logo */}
        <div className="px-4 py-5 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
            Tiffix
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Vendor Panel</p>
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
                      : 'text-slate-300 hover:text-orange-400 hover:bg-slate-700/30'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-orange-400' : 'text-slate-400 group-hover:text-orange-400'}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700/50">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/20 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <span className="text-slate-900 text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'V'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-slate-200 text-xs font-medium truncate">{user?.name || 'Vendor User'}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email || 'vendor@tiffix.com'}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-orange-400 hover:bg-slate-700/30 transition-colors group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-orange-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full bg-gradient-to-br from-slate-900 to-slate-800">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default VendorLayout;