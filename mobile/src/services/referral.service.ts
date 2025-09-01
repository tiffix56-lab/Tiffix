import { apiService } from './api.service';
import { ApiResponse } from '../types/auth.types';

export interface ReferralData {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
}

class ReferralService {
  async getReferralData(): Promise<ApiResponse<ReferralData>> {
    return await apiService.get<ReferralData>('/user/referral');
  }

  async sendInvite(email: string): Promise<ApiResponse> {
    return await apiService.post('/user/referral/invite', { email });
  }
}

export const referralService = new ReferralService();