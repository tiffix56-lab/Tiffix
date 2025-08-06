import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestManagementQueue } from "./RequestManagementQueue";

import { 
  RefreshCw, 
  CreditCard, 
  BarChart3, 
  Settings,
  Bell,
  Filter
} from "lucide-react";

export function RequestManagementDashboard() {
  const [activeTab, setActiveTab] = useState("requests");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Request Management</h1>
          <p className="text-muted-foreground mt-1">
            Handle user requests and manage credit systems
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold text-foreground">8</p>
              <p className="text-xs text-warning">Needs processing</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Skip Credits Used</p>
              <p className="text-2xl font-bold text-foreground">18</p>
              <p className="text-xs text-success">This week</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Referral Credits</p>
              <p className="text-2xl font-bold text-foreground">11</p>
              <p className="text-xs text-success">Available</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Processing Rate</p>
              <p className="text-2xl font-bold text-foreground">94%</p>
              <p className="text-xs text-success">Within 24h</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Request Management Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Request Queue
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="space-y-4">
          <RequestManagementQueue />
        </TabsContent>
      </Tabs>
    </div>
  );
}