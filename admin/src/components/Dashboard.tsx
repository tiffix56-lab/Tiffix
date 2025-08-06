import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  ChefHat, 
  Clock, 
  TrendingUp, 
  Users, 
  UtensilsCrossed,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  UserCheck,
  RefreshCw,
  CreditCard,
  X,
  SkipForward,
  ArrowRightLeft,
  Calendar,
  Menu
} from "lucide-react";

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your Tiffix operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-vendor">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Vendor Food</p>
              <p className="text-2xl font-bold text-white">23</p>
              <p className="text-xs text-white/70">Active providers</p>
            </div>
            <Building2 className="w-8 h-8 text-white/80" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-chef">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Home Chef</p>
              <p className="text-2xl font-bold text-white">18</p>
              <p className="text-xs text-white/70">Active chefs</p>
            </div>
            <ChefHat className="w-8 h-8 text-white/80" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Assignments</p>
              <p className="text-2xl font-bold text-foreground">23</p>
              <p className="text-xs text-warning">Need provider assignment</p>
            </div>
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">User Requests</p>
              <p className="text-2xl font-bold text-foreground">8</p>
              <p className="text-xs text-warning">Skip/Cancel/Switch pending</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '/assignments'}
            >
              <UserCheck className="w-6 h-6" />
              <span className="text-sm">Assign Meals</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '/requests'}
            >
              <RefreshCw className="w-6 h-6" />
              <span className="text-sm">Manage Requests</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '/menu'}
            >
              <Menu className="w-6 h-6" />
              <span className="text-sm">Update Menus</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => window.location.href = '/analytics'}
            >
              <CreditCard className="w-6 h-6" />
              <span className="text-sm">View Analytics</span>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-success" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Weekly meals assigned to user #U247</p>
                <p className="text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ArrowRightLeft className="w-4 h-4 text-warning" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Switch request: User #U156 to different vendor</p>
                <p className="text-xs text-muted-foreground">5 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SkipForward className="w-4 h-4 text-info" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Skip meal request for Tuesday - User #U89</p>
                <p className="text-xs text-muted-foreground">8 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <X className="w-4 h-4 text-destructive" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Cancel meal request for Thursday - User #U203</p>
                <p className="text-xs text-muted-foreground">12 minutes ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Assignment Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Assignment Actions</h3>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => window.location.href = '/assignments'}
            >
              <UserCheck className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Meal Assignment Queue</div>
                <div className="text-xs text-muted-foreground">23 users pending assignment</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => window.location.href = '/providers'}
            >
              <Building2 className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Provider Management</div>
                <div className="text-xs text-muted-foreground">5 vendors, 2 chefs active</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => window.location.href = '/bulk-assign'}
            >
              <RefreshCw className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Bulk Assignment</div>
                <div className="text-xs text-muted-foreground">Auto-assign based on preferences</div>
              </div>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Assignment Analytics</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Weekly Assignment Rate</span>
              <span className="text-lg font-bold text-green-600">87%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-lg font-bold text-foreground">156</div>
                <div className="text-xs text-muted-foreground">Vendor assignments</div>
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">89</div>
                <div className="text-xs text-muted-foreground">Chef assignments</div>
              </div>
            </div>
            
            <Button size="sm" variant="outline" className="w-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              View Full Analytics
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}