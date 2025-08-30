import { apiService } from './api.service';
import { ApiResponse } from '../types/auth.types';

export interface Transaction {
  _id: string;
  userId: string;
  subscriptionId: string;
  orderId: string;
  amount: number;
  originalAmount: number;
  discountApplied: number;
  finalAmount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  type: 'subscription_purchase' | 'refund';
  paymentGateway: 'razorpay';
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  promoCodeUsed?: string;
  refund?: {
    refundId: string;
    refundAmount: number;
    refundDate: string;
    refundReason: string;
    refundStatus: string;
  };
  createdAt: string;
  updatedAt: string;
  subscription?: {
    planName: string;
    duration: string;
    durationDays: number;
  };
}

export interface TransactionResponse {
  transactions: Transaction[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

class TransactionService {
  async getUserTransactions(): Promise<ApiResponse<TransactionResponse>> {
    return await apiService.get<TransactionResponse>('/my-transactions');
  }

  async getTransactionById(id: string): Promise<ApiResponse<{ transaction: Transaction }>> {
    return await apiService.get<{ transaction: Transaction }>(`/my-transactions/${id}`);
  }
}

export const transactionService = new TransactionService();