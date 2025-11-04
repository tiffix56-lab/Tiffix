import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/auth.types';

export interface Review {
  _id: string;
  userId: string;
  orderId?: string;
  subscriptionId?: string;
  vendorId?: string;
  rating: number;
  comment: string;
  isModerated: boolean;
  moderationNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  reviewType: 'order' | 'subscription' | 'vendor';
  orderId?: string;
  subscriptionId?: string;
  vendorId?: string;
  rating: number;
  reviewText: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

class ReviewService {
  async createReview(data: CreateReviewRequest): Promise<ApiResponse<{ review: Review }>> {
    return await apiService.post<{ review: Review }>(API_ENDPOINTS.REVIEWS.CREATE, data);
  }

  async getMyReviews(): Promise<ApiResponse<{ reviews: Review[] }>> {
    try {
      const response = await apiService.get<{ reviews: Review[] }>(API_ENDPOINTS.REVIEWS.MY_REVIEWS);
      
      if (!response.success && response.message?.includes('not found')) {
        return {
          success: true,
          message: 'No reviews found',
          data: { reviews: [] }
        };
      }
      
      return response;
    } catch (error) {
      return {
        success: true,
        message: 'No reviews found', 
        data: { reviews: [] }
      };
    }
  }

  async updateReview(reviewId: string, data: UpdateReviewRequest): Promise<ApiResponse<{ review: Review }>> {
    return await apiService.patch<{ review: Review }>(`${API_ENDPOINTS.REVIEWS.UPDATE}/${reviewId}`, data);
  }

  async deleteReview(reviewId: string): Promise<ApiResponse<{ message: string }>> {
    return await apiService.delete<{ message: string }>(`${API_ENDPOINTS.REVIEWS.DELETE}/${reviewId}`);
  }

  async getSubscriptionReviews(subscriptionId: string): Promise<ApiResponse<{ reviews: Review[] }>> {
    return await apiService.get<{ reviews: Review[] }>(`${API_ENDPOINTS.REVIEWS.PUBLIC_SUBSCRIPTION}/${subscriptionId}/reviews`);
  }

  async getVendorReviews(vendorId: string): Promise<ApiResponse<{ reviews: Review[] }>> {
    return await apiService.get<{ reviews: Review[] }>(`${API_ENDPOINTS.REVIEWS.PUBLIC_VENDOR}/${vendorId}/reviews`);
  }

  async getOrderReview(orderId: string): Promise<ApiResponse<{ review: Review }>> {
    return await apiService.get<{ review: Review }>(`${API_ENDPOINTS.REVIEWS.PUBLIC_ORDER}/${orderId}/review`);
  }
}

export const reviewService = new ReviewService();