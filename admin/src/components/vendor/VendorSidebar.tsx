import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Package,
  Calendar,
  Users,
  Star,
  Clock,
  ChefHat
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const vendorNavItems = [
  { title: "Dashboard", url: "/vendor", icon: Home },
  { title: "Orders", url: "/vendor/orders", icon: Package },
  { title: "Calendar", url: "/vendor/calendar", icon: Calendar },
  { title: "Customers", url: "/vendor/customers", icon: Users },
  { title: "Reviews", url: "/vendor/reviews", icon: Star },
  { title: "Availability", url: "/vendor/availability", icon: Clock },
];

export function VendorSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-accent";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg text-sidebar-foreground">Tiffix</h2>
                <p className="text-xs text-sidebar-foreground opacity-70">Vendor Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Vendor Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vendorNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavClass}>
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}