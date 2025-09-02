import { apiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api';
import { ApiResponse } from '../types/auth.types';

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  availableCredits: number;
  referralCode: string;
  referralLink: string;
}

export interface ReferralLeaderboard {
  userId: string;
  userName: string;
  totalReferrals: number;
  rank: number;
}

class ReferralService {
  async generateReferralLink(): Promise<ApiResponse<{ referralLink: string; referralCode: string }>> {
    return await apiService.get<{ referralLink: string; referralCode: string }>(API_ENDPOINTS.REFERRAL.GENERATE_LINK);
  }

  async getReferralStats(): Promise<ApiResponse<ReferralStats>> {
    return await apiService.get<ReferralStats>(API_ENDPOINTS.REFERRAL.STATS);
  }

  async validateReferralCode(referralCode: string): Promise<ApiResponse<{ isValid: boolean; referrerName?: string }>> {
    return await apiService.get<{ isValid: boolean; referrerName?: string }>(`${API_ENDPOINTS.REFERRAL.VALIDATE}/${referralCode}`);
  }

  async getReferralLeaderboard(): Promise<ApiResponse<{ leaderboard: ReferralLeaderboard[] }>> {
    return await apiService.get<{ leaderboard: ReferralLeaderboard[] }>(API_ENDPOINTS.REFERRAL.LEADERBOARD);
  }
}

export const referralService = new ReferralService();