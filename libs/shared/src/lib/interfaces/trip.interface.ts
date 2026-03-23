export interface Trip {
  tripId: string;
  userId: string;
  tripName: string;
  createdAt: string;
  isActive: boolean;
  inviteCode?: string;
  imageS3Key?: string;
  status: 'active' | 'settled';
  startDate?: string;
  endDate?: string;
}
