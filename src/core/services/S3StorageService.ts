import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner";

export interface UploadFileParams {
  key: string;
  body: Buffer;
  contentType?: string;
  contentLength?: number;
  cacheControl?: string;
  acl?: "private" | "public-read";
}

export class S3StorageService {
  private static instance: S3StorageService;
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;
  private readonly baseUrl?: string;
  private readonly signedUrlTTL: number;

  private constructor() {
    const {
      AWS_S3_BUCKET,
      AWS_S3_REGION,
      AWS_S3_ENDPOINT,
      AWS_S3_FORCE_PATH_STYLE,
      AWS_S3_BASE_URL,
      AWS_S3_SIGNED_URL_TTL,
      AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY,
    } = process.env;

    if (!AWS_S3_BUCKET) {
      throw new Error("AWS_S3_BUCKET no está configurado");
    }
    if (!AWS_S3_REGION) {
      throw new Error("AWS_S3_REGION no está configurado");
    }

    this.bucket = AWS_S3_BUCKET;
    this.region = AWS_S3_REGION;
    this.baseUrl = AWS_S3_BASE_URL ? AWS_S3_BASE_URL.replace(/\/+$/, "") : undefined;
    this.signedUrlTTL = parseInt(AWS_S3_SIGNED_URL_TTL || "900", 10);

    this.client = new S3Client({
      region: AWS_S3_REGION,
      endpoint: AWS_S3_ENDPOINT,
      forcePathStyle: AWS_S3_FORCE_PATH_STYLE === "true",
      credentials:
        AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: AWS_ACCESS_KEY_ID,
              secretAccessKey: AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

  public static getInstance(): S3StorageService {
    if (!S3StorageService.instance) {
      S3StorageService.instance = new S3StorageService();
    }
    return S3StorageService.instance;
  }

  public async uploadFile({
    key,
    body,
    contentType,
    contentLength,
    cacheControl,
    acl = "private",
  }: UploadFileParams): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentLength: contentLength,
        CacheControl: cacheControl,
        ACL: acl,
      })
    );
  }

  public async deleteFile(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  public async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return getPresignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      {
        expiresIn: expiresIn ?? this.signedUrlTTL,
      }
    );
  }

  public getPublicUrl(key: string): string {
    if (this.baseUrl) {
      return `${this.baseUrl}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  public getBucket(): string {
    return this.bucket;
  }
}


