import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Star,
  Search,
  Filter,
  Trash2,
  Eye,
  Building2,
  ChefHat,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Flag
} from "lucide-react";

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  providerId: string;
  providerName: string;
  providerType: 'vendor' | 'homechef';
  orderId: string;
  menuItem: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
  reported: boolean;
  status: 'active' | 'flagged' | 'removed';
}

const mockReviews: Review[] = [
  {
    id: "R001",
    userId: "U001",
    userName: "Rahul Sharma",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
    providerId: "V001",
    providerName: "Spice Palace Restaurant",
    providerType: "vendor",
    orderId: "ORD001",
    menuItem: "Chicken Biryani",
    rating: 5,
    comment: "Absolutely delicious! The biryani was perfectly cooked with authentic flavors. The chicken was tender and the rice was aromatic. Will definitely order again!",
    date: "2024-01-24",
    verified: true,
    helpful: 12,
    reported: false,
    status: "active"
  },
  {
    id: "R002",
    userId: "U002",
    userName: "Priya Singh",
    userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b766?w=100",
    providerId: "C001",
    providerName: "Chef Sunita",
    providerType: "homechef",
    orderId: "ORD003",
    menuItem: "Home Style Dal Chawal",
    rating: 4,
    comment: "Good home-cooked taste. The dal was well seasoned and the rice was perfectly cooked. Packaging was also neat.",
    date: "2024-01-23",
    verified: true,
    helpful: 8,
    reported: false,
    status: "active"
  },
  {
    id: "R003",
    userId: "U003",
    userName: "Amit Kumar",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    providerId: "V002",
    providerName: "Taste Hub",
    providerType: "vendor",
    orderId: "ORD004",
    menuItem: "Margherita Pizza",
    rating: 2,
    comment: "Pizza was cold when delivered and cheese was not fresh. Very disappointed with the quality.",
    date: "2024-01-22",
    verified: true,
    helpful: 3,
    reported: true,
    status: "flagged"
  },
  {
    id: "R004",
    userId: "U004",
    userName: "Sneha Patel",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
    providerId: "C002",
    providerName: "Chef Maria",
    providerType: "homechef",
    orderId: "ORD005",
    menuItem: "Mediterranean Bowl",
    rating: 5,
    comment: "Fresh ingredients and perfectly balanced flavors. The quinoa was cooked perfectly and vegetables were crispy. Healthy and delicious!",
    date: "2024-01-21",
    verified: true,
    helpful: 15,
    reported: false,
    status: "active"
  },
  {
    id: "R005",
    userId: "U005",
    userName: "Raj Malhotra",
    providerId: "V001",
    providerName: "Spice Palace Restaurant",
    providerType: "vendor",
    orderId: "ORD006",
    menuItem: "Paneer Thali",
    rating: 1,
    comment: "Worst food ever! Completely spoiled and smelled bad. This is unacceptable!",
    date: "2024-01-20",
    verified: false,
    helpful: 0,
    reported: true,
    status: "flagged"
  }
];

export function ReviewManagement() {
  const [reviews, setReviews] = useState(mockReviews);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [filterProvider, setFilterProvider] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.menuItem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = filterRating === "all" || review.rating.toString() === filterRating;
    const matchesProvider = filterProvider === "all" || review.providerType === filterProvider;
    const matchesStatus = filterStatus === "all" || review.status === filterStatus;
    
    return matchesSearch && matchesRating && matchesProvider && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "helpful":
        return b.helpful - a.helpful;
      case "provider":
        return a.providerName.localeCompare(b.providerName);
      case "date":
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const handleDeleteReview = (reviewId: string) => {
    setReviews(reviews.filter(review => review.id !== reviewId));
    toast({
      title: "Review Deleted",
      description: "The inappropriate review has been removed successfully"
    });
  };

  const handleToggleFlag = (reviewId: string) => {
    setReviews(reviews.map(review => 
      review.id === reviewId 
        ? { 
            ...review, 
            status: review.status === 'flagged' ? 'active' : 'flagged',
            reported: review.status !== 'flagged'
          }
        : review
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'flagged': return 'bg-yellow-100 text-yellow-800';
      case 'removed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Review Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and moderate customer reviews across all providers
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold text-foreground">{reviews.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ThumbsUp className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">
                {reviews.filter(r => r.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Flag className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Flagged</p>
              <p className="text-2xl font-bold text-foreground">
                {reviews.filter(r => r.status === 'flagged').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-foreground">
                {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <ThumbsDown className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Ratings</p>
              <p className="text-2xl font-bold text-foreground">
                {reviews.filter(r => r.rating <= 2).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterProvider} onValueChange={setFilterProvider}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Provider type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="vendor">Vendor Food</SelectItem>
              <SelectItem value="homechef">Home Chef</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Review status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="removed">Removed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="helpful">Helpful Votes</SelectItem>
              <SelectItem value="provider">Provider</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="p-6">
            <div className="flex gap-6">
              {/* User Info */}
              <div className="flex-shrink-0">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={review.userAvatar} alt={review.userName} />
                  <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>

              {/* Review Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{review.userName}</h4>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                      <Badge className={getStatusColor(review.status)}>
                        {review.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className={`w-4 h-4 rounded ${
                        review.providerType === 'vendor' ? 'bg-blue-500' : 'bg-orange-500'
                      } flex items-center justify-center`}>
                        {review.providerType === 'vendor' ? (
                          <Building2 className="w-3 h-3 text-white" />
                        ) : (
                          <ChefHat className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span>{review.providerName}</span>
                      <span>•</span>
                      <span>{review.menuItem}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {review.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm font-medium">{review.rating}.0</span>
                  </div>
                </div>

                <p className="text-foreground mb-4 leading-relaxed">
                  {review.comment}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.helpful} helpful</span>
                    </div>
                    <span>Order #{review.orderId}</span>
                    {review.reported && (
                      <div className="flex items-center gap-1 text-red-600">
                        <Flag className="w-4 h-4" />
                        <span>Reported</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleToggleFlag(review.id)}
                    >
                      <Flag className="w-3 h-3 mr-1" />
                      {review.status === 'flagged' ? 'Unflag' : 'Flag'}
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Review</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this review? This action cannot be undone.
                            The review will be permanently removed from the platform.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteReview(review.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Review
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <Card className="p-12 text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Reviews Found</h3>
          <p className="text-muted-foreground">
            No reviews match your current filter criteria. Try adjusting your filters.
          </p>
        </Card>
      )}
    </div>
  );
}