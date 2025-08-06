import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar, 
  ChefHat, 
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface UserMealSelection {
  userId: string;
  userName: string;
  email: string;
  selections: {
    day: string;
    mealType: 'vendor' | 'chef';
    assigned: boolean;
    assignedProvider?: string;
  }[];
  totalMeals: number;
  assignedMeals: number;
  subscriptionPlan: string;
  joinDate: string;
}

const mockUserSelections: UserMealSelection[] = [
  {
    userId: "U247",
    userName: "Sarah K.",
    email: "sarah.k@email.com",
    subscriptionPlan: "Monthly Premium",
    joinDate: "2024-01-15",
    totalMeals: 7,
    assignedMeals: 0,
    selections: [
      { day: "Monday", mealType: "vendor", assigned: false },
      { day: "Tuesday", mealType: "chef", assigned: false },
      { day: "Wednesday", mealType: "vendor", assigned: false },
      { day: "Thursday", mealType: "vendor", assigned: false },
      { day: "Friday", mealType: "chef", assigned: false },
      { day: "Saturday", mealType: "vendor", assigned: false },
      { day: "Sunday", mealType: "vendor", assigned: false },
    ]
  },
  {
    userId: "U156",
    userName: "John D.",
    email: "john.d@email.com",
    subscriptionPlan: "Weekly Basic",
    joinDate: "2024-01-20",
    totalMeals: 7,
    assignedMeals: 3,
    selections: [
      { day: "Monday", mealType: "chef", assigned: true, assignedProvider: "Chef Maria" },
      { day: "Tuesday", mealType: "chef", assigned: true, assignedProvider: "Chef Maria" },
      { day: "Wednesday", mealType: "vendor", assigned: true, assignedProvider: "Spice Palace" },
      { day: "Thursday", mealType: "chef", assigned: false },
      { day: "Friday", mealType: "vendor", assigned: false },
      { day: "Saturday", mealType: "chef", assigned: false },
      { day: "Sunday", mealType: "vendor", assigned: false },
    ]
  },
  {
    userId: "U89",
    userName: "Mike R.",
    email: "mike.r@email.com",
    subscriptionPlan: "Monthly Standard",
    joinDate: "2024-01-18",
    totalMeals: 7,
    assignedMeals: 7,
    selections: [
      { day: "Monday", mealType: "vendor", assigned: true, assignedProvider: "Taste Hub" },
      { day: "Tuesday", mealType: "vendor", assigned: true, assignedProvider: "Taste Hub" },
      { day: "Wednesday", mealType: "vendor", assigned: true, assignedProvider: "Spice Palace" },
      { day: "Thursday", mealType: "vendor", assigned: true, assignedProvider: "Taste Hub" },
      { day: "Friday", mealType: "vendor", assigned: true, assignedProvider: "Food Corner" },
      { day: "Saturday", mealType: "vendor", assigned: true, assignedProvider: "Spice Palace" },
      { day: "Sunday", mealType: "chef", assigned: true, assignedProvider: "Chef Kumar" },
    ]
  }
];

export function MealAssignmentQueue() {
  const pendingUsers = mockUserSelections.filter(user => user.assignedMeals < user.totalMeals);
  const completedUsers = mockUserSelections.filter(user => user.assignedMeals === user.totalMeals);

  const getStatusBadge = (user: UserMealSelection) => {
    const progress = (user.assignedMeals / user.totalMeals) * 100;
    if (progress === 100) {
      return <Badge variant="default" className="bg-green-500 text-white">Complete</Badge>;
    } else if (progress > 0) {
      return <Badge variant="secondary">Partial</Badge>;
    } else {
      return <Badge variant="destructive">Pending</Badge>;
    }
  };

  const getProgressColor = (assignedMeals: number, totalMeals: number) => {
    const progress = (assignedMeals / totalMeals) * 100;
    if (progress === 100) return "bg-green-500";
    if (progress > 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Assignments</p>
              <p className="text-2xl font-bold text-foreground">{pendingUsers.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{completedUsers.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Meals to Assign</p>
              <p className="text-2xl font-bold text-foreground">
                {pendingUsers.reduce((acc, user) => acc + (user.totalMeals - user.assignedMeals), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Assignments */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Pending Meal Assignments</h3>
          <Button variant="outline" size="sm">
            Bulk Assign
          </Button>
        </div>
        
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div key={user.userId} className="p-4 bg-secondary rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">User #{user.userId} - {user.userName}</span>
                      {getStatusBadge(user)}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.subscriptionPlan}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {user.assignedMeals}/{user.totalMeals} assigned
                  </div>
                  <div className="w-20 h-2 bg-muted rounded-full mt-1">
                    <div 
                      className={`h-full rounded-full ${getProgressColor(user.assignedMeals, user.totalMeals)}`}
                      style={{ width: `${(user.assignedMeals / user.totalMeals) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Weekly Selection Grid */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {user.selections.map((selection, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {selection.day.slice(0, 3)}
                    </div>
                    <div className={`p-2 rounded text-xs ${
                      selection.assigned 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : selection.mealType === 'vendor' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-orange-100 text-orange-800 border border-orange-200'
                    }`}>
                      <div className="flex items-center justify-center gap-1">
                        {selection.mealType === 'vendor' ? (
                          <Building2 className="w-3 h-3" />
                        ) : (
                          <ChefHat className="w-3 h-3" />
                        )}
                        <span className="capitalize">{selection.mealType}</span>
                      </div>
                      {selection.assigned && selection.assignedProvider && (
                        <div className="text-xs mt-1 font-medium">
                          {selection.assignedProvider}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Assign Providers
                </Button>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Completed Assignments */}
      {completedUsers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recently Completed</h3>
          <div className="space-y-3">
            {completedUsers.map((user) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <span className="font-medium text-sm">User #{user.userId} - {user.userName}</span>
                    <p className="text-xs text-muted-foreground">All 7 meals assigned</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-green-500 text-white">Complete</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}