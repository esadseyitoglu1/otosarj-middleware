/**
 * Basit sabit-pencere rate limiter.
 *
 * GUVENLIK KARARI (plan G3): enumeration ve veri sizdirma denemelerini
 * yavaslatir. Prototipte in-memory; gercek dagitimda Redis vb. paylasimli
 * store gerekir (coklu instance'da bu implementasyon calismaz -- bilinen sinir).
 */
import type { NextFunction, Request, Response } from 'express';

interface Bucket {
  count: number;
  windowStartMs: number;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyFn?: (req: Request) => string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  const keyFn = options.keyFn ?? ((req: Request) => req.ip ?? 'unknown');

  return function rateLimit(req: Request, res: Response, next: NextFunction): void {
    const key = keyFn(req);
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStartMs >= options.windowMs) {
      buckets.set(key, { count: 1, windowStartMs: now });
      next();
      return;
    }

    if (bucket.count >= options.maxRequests) {
      res.status(429).json({ error: 'too_many_requests' });
      return;
    }

    bucket.count += 1;
    next();
  };
}
