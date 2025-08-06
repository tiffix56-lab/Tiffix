import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MealAssignmentQueue } from "./MealAssignmentQueue";
import { ProviderAssignmentSystem } from "./ProviderAssignmentSystem";
import { 
  Users, 
  ChefHat, 
  Building2, 
  Calendar,
  BarChart3,
  Settings
} from "lucide-react";

export function AssignmentDashboard() {
  const [activeTab, setActiveTab] = useState("queue");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meal Assignment System</h1>
          <p className="text-muted-foreground mt-1">
            Manage user meal selections and provider assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Users Pending Assignment</p>
              <p className="text-2xl font-bold text-foreground">23</p>
              <p className="text-xs text-warning">Need immediate attention</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vendor Assignments</p>
              <p className="text-2xl font-bold text-foreground">156</p>
              <p className="text-xs text-success">This week</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Chef Assignments</p>
              <p className="text-2xl font-bold text-foreground">89</p>
              <p className="text-xs text-success">This week</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assignment Rate</p>
              <p className="text-2xl font-bold text-foreground">87%</p>
              <p className="text-xs text-success">Above target</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Assignment Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Assignment Queue
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            Provider Management
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="queue" className="space-y-4">
          <MealAssignmentQueue />
        </TabsContent>
        
        <TabsContent value="providers" className="space-y-4">
          <ProviderAssignmentSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
}