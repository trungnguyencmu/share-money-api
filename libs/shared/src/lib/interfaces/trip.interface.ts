export interface Trip {
  tripId: string;
  userId: string;
  tripName: string;
  createdAt: string;
  isActive: boolean;
  inviteCode?: string;
  imageS3Key?: string;
  status: 'active' | 'upcoming' | 'settled';
  startDate?: string;
  endDate?: string;
}
