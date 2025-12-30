import rateLimit from 'express-rate-limit';

// Rate limiting configuration
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: any, res: any) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: req.rateLimit?.resetTime,
      },
    });
  },
});

// Stricter rate limiter for video creation endpoint
export const createStoryLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 5, // Limit each IP to 5 story creations per minute
  message: 'Too many story creation requests, please slow down.',
  skipSuccessfulRequests: false,
});
