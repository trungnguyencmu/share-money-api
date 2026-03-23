export interface TripMember {
  tripId: string;
  userId: string;
  displayName: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: string;
}
