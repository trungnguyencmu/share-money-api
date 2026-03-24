import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  private readonly UPLOAD_URL_EXPIRY = 3600; // 1 hour
  private readonly VIEW_URL_EXPIRY = 900; // 15 minutes

  constructor(private readonly configService: ConfigService) {
    const region =
      this.configService.get<string>('S3_REGION') ||
      this.configService.get<string>('AWS_REGION') ||
      'ap-southeast-1';
    this.bucketName =
      this.configService.get<string>('S3_IMAGES_BUCKET') ||
      this.configService.get<string>('S3_BUCKET_NAME') ||
      'share-money-images-dev';
    this.s3Client = new S3Client({
      region,
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async generatePresignedUploadUrl(
    s3Key: string,
    contentType: string,
    bucket?: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket || this.bucketName,
      Key: s3Key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: this.UPLOAD_URL_EXPIRY,
    });
  }

  async generatePresignedGetUrl(s3Key: string, bucket?: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket || this.bucketName,
      Key: s3Key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: this.VIEW_URL_EXPIRY,
    });
  }

  async deleteObject(s3Key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
    });

    await this.s3Client.send(command);
  }

  async deleteObjects(s3Keys: string[]): Promise<void> {
    if (s3Keys.length === 0) return;

    // DeleteObjects supports max 1000 keys per request
    const batchSize = 1000;
    for (let i = 0; i < s3Keys.length; i += batchSize) {
      const batch = s3Keys.slice(i, i + batchSize);
      const command = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
        },
      });

      await this.s3Client.send(command);
    }
  }

  getUploadUrlExpiry(): number {
    return this.UPLOAD_URL_EXPIRY;
  }
}
