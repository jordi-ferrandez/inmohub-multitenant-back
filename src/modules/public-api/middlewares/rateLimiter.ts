import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate limiter for the Public API.
 * Uses the API Key ID as the key if available, otherwise falls back to IP address.
 */
export const publicApiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each key/IP to 60 requests per minute by default
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req: Request) => {
    // If authenticated via API Key, limit by Key ID
    if (req.apiKey && req.apiKey.id) {
      return `apikey_${req.apiKey.id}`;
    }
    // Otherwise fallback to IP
    return req.ip || 'unknown_ip';
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
      error: 'Rate limit exceeded',
    });
  },
  message: 'Too many requests from this API Key, please try again later.',
});
