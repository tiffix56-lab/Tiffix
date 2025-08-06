import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { VendorSidebar } from "./VendorSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChefHat, Store, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface VendorLayoutProps {
  children: React.ReactNode;
}

export function VendorLayout({ children }: VendorLayoutProps) {
  const [providerType, setProviderType] = useState<"vendor" | "home-chef">("vendor");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <VendorSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center justify-between h-full px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <Link to="/">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Admin
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Provider Type:</span>
                  <Badge 
                    variant={providerType === "vendor" ? "default" : "secondary"}
                    className="gap-1.5 cursor-pointer"
                    onClick={() => setProviderType(providerType === "vendor" ? "home-chef" : "vendor")}
                  >
                    {providerType === "vendor" ? (
                      <>
                        <Store className="h-3 w-3" />
                        Vendor
                      </>
                    ) : (
                      <>
                        <ChefHat className="h-3 w-3" />
                        Home Chef
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}