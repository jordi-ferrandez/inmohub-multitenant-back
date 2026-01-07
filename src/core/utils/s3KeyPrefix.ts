export function prependS3EnvPrefix(path: string): string {
  const rawPrefix = process.env.AWS_S3_PREFIX_ENV?.trim();
  if (!rawPrefix) {
    return path.replace(/^\/+/, "");
  }

  const normalizedPrefix = rawPrefix.replace(/(^\/+|\/+$)/g, "");
  const normalizedPath = path.replace(/(^\/+)/, "");

  if (!normalizedPrefix) {
    return normalizedPath;
  }

  return `${normalizedPrefix}/${normalizedPath}`;
}


