function getEnvironmentVariables() {
  const env = process.env.NODE_ENV || "development";
  const envFile = `.env.${env}`;

  require("dotenv").config({ path: envFile });

  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT || 4000,
    HOST: process.env.HOST || "localhost",
    DATABASE_URL: process.env.DATABASE_URL,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET || "defaultsecret",
    SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS || "10", 10),
    AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
    AWS_S3_REGION: process.env.AWS_S3_REGION,
    AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
    AWS_S3_FORCE_PATH_STYLE: process.env.AWS_S3_FORCE_PATH_STYLE,
    AWS_S3_BASE_URL: process.env.AWS_S3_BASE_URL,
    AWS_S3_SIGNED_URL_TTL: process.env.AWS_S3_SIGNED_URL_TTL,
    ATTACHMENTS_MAX_FILE_SIZE_MB: process.env.ATTACHMENTS_MAX_FILE_SIZE_MB,
  };
}
export { getEnvironmentVariables };
