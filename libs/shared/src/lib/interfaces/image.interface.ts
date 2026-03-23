export interface TripImage {
  tripId: string;
  imageId: string;
  uploadedBy: string;
  uploaderDisplayName: string;
  fileName: string;
  s3Key: string;
  contentType: string;
  size: number;
  createdAt: string;
}
