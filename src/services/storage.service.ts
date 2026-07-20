import { PutObjectCommand, DeleteObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3';
import { config } from '../config/env';

export class StorageService {
  private bucket = config.s3Bucket;

  async ensureBucketExists(): Promise<void> {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
    // Garantir política pública sempre (idempotente).
    // Provedores como Cloudflare R2 não suportam PutBucketPolicy — nesse caso,
    // o acesso público deve ser configurado no dashboard do provedor.
    try {
      await this.setBucketPublicPolicy();
    } catch (err) {
      console.warn('Não foi possível aplicar a política pública do bucket automaticamente. Confirma que o bucket está configurado como público no provedor de storage.', err);
    }
  }

  private async setBucketPublicPolicy(): Promise<void> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };

    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify(policy),
      })
    );
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      })
    );
    return this.getPublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  getPublicUrl(key: string): string {
    return `${config.s3PublicUrl}/${key}`;
  }
}

export const storageService = new StorageService();
