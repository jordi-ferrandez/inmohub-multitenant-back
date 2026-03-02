import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '../../api-keys/services/ApiKeyService';
import { prisma } from '@core/lib';

/**
 * Middleware to authenticate requests using an API Key.
 * Also handles IP restriction and request logging (auditing).
 */
export const authApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const rawKey = req.header('X-API-Key');

  if (!rawKey) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: 'No x-api-key header provided',
    });
    return;
  }

  try {
    const apiKey = await apiKeyService.validateApiKey(rawKey);

    if (!apiKey) {
      res.status(403).json({
        success: false,
        message: 'Authentication failed',
        error: 'Invalid or inactive API Key',
      });
      return;
    }

    // IP restriction check (if any configured)
    if (apiKey.restrictedIps && apiKey.restrictedIps.length > 0) {
      const clientIp = req.ip || req.socket.remoteAddress;
      // Note: In some environments (proxies), you might need to check x-forwarded-for
      if (clientIp && !apiKey.restrictedIps.includes(clientIp)) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'IP address not authorized',
        });
        return;
      }
    }

    // Attach API Key and Company info to the request for use in controllers
    req.apiKey = apiKey;

    // Capture start time for auditing
    const start = Date.now();

    // Hook into response finish to log the audit record
    res.on('finish', () => {
      const duration = Date.now() - start;
      prisma.apiLog
        .create({
          data: {
            apiKeyId: apiKey.id,
            endpoint: req.originalUrl.split('?')[0], // Log path only to avoid leaking query params if sensitive
            method: req.method,
            status: res.statusCode,
            duration,
            ip: req.ip || req.socket.remoteAddress,
          },
        })
        .catch((err) => {
          // Silently fail logging to not interrupt the service, but log the error locally
          console.error('Audit Log Error:', err);
        });
    });

    next();
  } catch (error) {
    console.error('API Key Authentication Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
};

/**
 * Middleware to check for specific scopes
 */
export const requireScope = (scope: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.apiKey;

    if (!apiKey || !apiKey.scopes) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'No permissions (scopes) found',
      });
      return;
    }

    if (!apiKey.scopes.includes(scope) && !apiKey.scopes.includes('*')) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: `Requires scope: ${scope}`,
      });
      return;
    }

    next();
  };
};
