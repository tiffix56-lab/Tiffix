import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, ChefHat } from "lucide-react";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  Tiffix Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground">
                  Centralized food service management
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Link to="/vendor">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ChefHat className="h-4 w-4" />
                    Vendor Panel
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@tiffix.com</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">AU</span>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}