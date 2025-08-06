import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MessageCircle, ThumbsUp, Filter } from "lucide-react";

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  orderId: string;
  reply?: string;
  helpful: number;
}

const mockReviews: Review[] = [
  {
    id: "REV001",
    customerName: "Rajesh Kumar",
    rating: 5,
    comment: "Excellent food quality and timely delivery! The dal rice was perfectly cooked and the sabzi was fresh. Will definitely order again.",
    date: "2024-01-18",
    orderId: "#1234",
    helpful: 12
  },
  {
    id: "REV002",
    customerName: "Priya Sharma",
    rating: 4,
    comment: "Good taste overall, but the roti could have been warmer. The biryani was amazing though!",
    date: "2024-01-17",
    orderId: "#1235",
    reply: "Thank you for the feedback! We'll ensure the roti is served hot next time. Glad you enjoyed the biryani!",
    helpful: 8
  },
  {
    id: "REV003",
    customerName: "Amit Singh",
    rating: 5,
    comment: "Amazing flavors! The thali was well-balanced and portions were generous. Best home-style cooking in the area.",
    date: "2024-01-16",
    orderId: "#1236",
    helpful: 15
  },
  {
    id: "REV004",
    customerName: "Sneha Patel",
    rating: 3,
    comment: "Food was okay, but delivery was delayed by 30 minutes. The taste was good but temperature was lukewarm.",
    date: "2024-01-15",
    orderId: "#1237",
    helpful: 3
  },
  {
    id: "REV005",
    customerName: "Vikram Gupta",
    rating: 5,
    comment: "Outstanding service and food quality! The packaging was excellent and everything arrived fresh and hot.",
    date: "2024-01-14",
    orderId: "#1238",
    reply: "Thank you so much for your kind words! We're thrilled you enjoyed your meal.",
    helpful: 20
  }
];

export function VendorReviews() {
  const [reviews, setReviews] = useState(mockReviews);
  const [filterRating, setFilterRating] = useState<string>("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleReply = (reviewId: string) => {
    if (replyText.trim()) {
      setReviews(prev => 
        prev.map(review => 
          review.id === reviewId 
            ? { ...review, reply: replyText }
            : review
        )
      );
      setReplyText("");
      setReplyingTo(null);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filterRating === "all") return true;
    return review.rating === parseInt(filterRating);
  });

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const totalReviews = reviews.length;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: (reviews.filter(r => r.rating === rating).length / totalReviews) * 100
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Customer Reviews</h1>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            <SelectItem value="5">5 Stars Only</SelectItem>
            <SelectItem value="4">4 Stars Only</SelectItem>
            <SelectItem value="3">3 Stars Only</SelectItem>
            <SelectItem value="2">2 Stars Only</SelectItem>
            <SelectItem value="1">1 Star Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rating Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-5 w-5 ${i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {totalReviews} reviews
              </p>
            </div>
            
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-8">{rating}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{review.customerName}</h3>
                        <Badge variant="outline">Order {review.orderId}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      {review.helpful}
                    </div>
                  </div>
                  
                  <p className="text-sm">{review.comment}</p>
                  
                  {review.reply && (
                    <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Your Reply</span>
                      </div>
                      <p className="text-sm">{review.reply}</p>
                    </div>
                  )}
                  
                  {!review.reply && (
                    <div className="pt-2 border-t">
                      {replyingTo === review.id ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Write your reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="min-h-20"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleReply(review.id)}>
                              Send Reply
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setReplyingTo(review.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}