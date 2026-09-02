import 'dotenv/config';

export const config = {
  // Server
  port: Number(process.env.PORT) || 3333,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // JWT
  jwtSecret: process.env.JWT_SECRET!,
  accessTokenExpiresIn: '15m',
  refreshTokenExpiresInDays: 30,

  // Upload
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB

  // S3 / MinIO
  s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  s3Region: process.env.S3_REGION || 'us-east-1',
  s3Bucket: process.env.S3_BUCKET || 'cosplay-angola',
  s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  s3PublicUrl: process.env.S3_PUBLIC_URL || 'http://localhost:9000/cosplay-angola',

  // Contacto (Resend)
  resendApiKey: process.env.RESEND_API_KEY,
  contactEmailTo: process.env.CONTACT_EMAIL_TO || 'cosplayangola@gmail.com',
  contactEmailFrom:
    process.env.CONTACT_EMAIL_FROM || 'Cosplay Angola <onboarding@resend.dev>',
};

// Validar variáveis obrigatórias
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}