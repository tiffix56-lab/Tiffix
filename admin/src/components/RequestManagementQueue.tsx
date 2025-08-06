import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  SkipForward, 
  X, 
  ArrowRightLeft, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  ChefHat,
  Building2
} from "lucide-react";

interface UserRequest {
  id: string;
  userId: string;
  userName: string;
  email: string;
  type: 'skip' | 'cancel' | 'switch';
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  mealDate: string;
  mealDay: string;
  currentProvider?: string;
  currentProviderType?: 'vendor' | 'chef';
  reason?: string;
  priority: 'high' | 'medium' | 'low';
  skipCreditsRemaining?: number;
}

const mockRequests: UserRequest[] = [
  {
    id: "REQ001",
    userId: "U156",
    userName: "John D.",
    email: "john.d@email.com",
    type: "switch",
    status: "pending",
    requestDate: "2024-01-25",
    mealDate: "2024-01-30",
    mealDay: "Tuesday",
    currentProvider: "Taste Hub",
    currentProviderType: "vendor",
    reason: "Food quality issues - too spicy",
    priority: "high"
  },
  {
    id: "REQ002", 
    userId: "U89",
    userName: "Mike R.",
    email: "mike.r@email.com",
    type: "skip",
    status: "pending",
    requestDate: "2024-01-25",
    mealDate: "2024-01-28",
    mealDay: "Sunday",
    currentProvider: "Chef Kumar",
    currentProviderType: "chef",
    reason: "Traveling for work",
    priority: "medium",
    skipCreditsRemaining: 5
  },
  {
    id: "REQ003",
    userId: "U203",
    userName: "Sarah M.",
    email: "sarah.m@email.com", 
    type: "cancel",
    status: "pending",
    requestDate: "2024-01-25",
    mealDate: "2024-01-29",
    mealDay: "Monday",
    currentProvider: "Spice Palace",
    currentProviderType: "vendor",
    reason: "Emergency came up",
    priority: "low"
  },
  {
    id: "REQ004",
    userId: "U178",
    userName: "Lisa K.",
    email: "lisa.k@email.com",
    type: "skip",
    status: "pending", 
    requestDate: "2024-01-24",
    mealDate: "2024-01-27",
    mealDay: "Saturday",
    currentProvider: "Chef Maria",
    currentProviderType: "chef",
    reason: "Family function",
    priority: "medium",
    skipCreditsRemaining: 2
  },
  {
    id: "REQ005",
    userId: "U145",
    userName: "David P.",
    email: "david.p@email.com",
    type: "switch",
    status: "approved",
    requestDate: "2024-01-24",
    mealDate: "2024-01-26",
    mealDay: "Friday",
    currentProvider: "Food Corner",
    currentProviderType: "vendor",
    reason: "Dietary restrictions not met",
    priority: "high"
  }
];

export function RequestManagementQueue() {
  const [requests, setRequests] = useState(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  const getRequestIcon = (type: UserRequest['type']) => {
    switch (type) {
      case 'skip': return SkipForward;
      case 'cancel': return X;
      case 'switch': return ArrowRightLeft;
      default: return Clock;
    }
  };

  const getRequestColor = (type: UserRequest['type']) => {
    switch (type) {
      case 'skip': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'cancel': return 'text-red-600 bg-red-50 border-red-200';
      case 'switch': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: UserRequest['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleApproveRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'approved' as const } : req
    ));
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: 'rejected' as const } : req
    ));
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold text-foreground">{pendingRequests.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <SkipForward className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Skip Requests</p>
              <p className="text-2xl font-bold text-foreground">
                {pendingRequests.filter(r => r.type === 'skip').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Switch Requests</p>
              <p className="text-2xl font-bold text-foreground">
                {pendingRequests.filter(r => r.type === 'switch').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <X className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cancel Requests</p>
              <p className="text-2xl font-bold text-foreground">
                {pendingRequests.filter(r => r.type === 'cancel').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Pending User Requests</h3>
          <Button variant="outline" size="sm">
            Bulk Process
          </Button>
        </div>
        
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const RequestIcon = getRequestIcon(request.type);
            
            return (
              <div 
                key={request.id} 
                className={`p-4 rounded-lg border ${getRequestColor(request.type)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${getRequestColor(request.type)} flex items-center justify-center`}>
                      <RequestIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{request.type.toUpperCase()} REQUEST</span>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`} />
                        <Badge variant="outline" className="text-xs">{request.priority} priority</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          User #{request.userId} - {request.userName}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    ID: {request.id}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Meal Details</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{request.mealDay}, {new Date(request.mealDate).toLocaleDateString()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {request.currentProviderType === 'vendor' ? (
                          <Building2 className="w-3 h-3" />
                        ) : (
                          <ChefHat className="w-3 h-3" />
                        )}
                        <span>{request.currentProvider}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Reason</div>
                    <div className="text-sm text-muted-foreground">
                      {request.reason}
                    </div>
                    {request.type === 'skip' && request.skipCreditsRemaining !== undefined && (
                      <div className="text-xs text-blue-600 mt-1">
                        {request.skipCreditsRemaining} skip credits remaining
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {request.type === 'skip' && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleApproveRequest(request.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Skip
                    </Button>
                  )}
                  
                  {request.type === 'cancel' && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleApproveRequest(request.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Confirm Cancel
                    </Button>
                  )}
                  
                  {request.type === 'switch' && (
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-2" />
                      Reassign Provider
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleRejectRequest(request.id)}
                  >
                    Reject
                  </Button>
                  
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recently Processed */}
      {processedRequests.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recently Processed</h3>
          <div className="space-y-3">
            {processedRequests.slice(0, 3).map((request) => {
              const RequestIcon = getRequestIcon(request.type);
              
              return (
                <div key={request.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <RequestIcon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="font-medium text-sm">
                        {request.type.toUpperCase()} - User #{request.userId}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {request.mealDay} meal - {request.currentProvider}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={request.status === 'approved' ? 'default' : 'secondary'}
                    className={request.status === 'approved' ? 'bg-green-500 text-white' : ''}
                  >
                    {request.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}