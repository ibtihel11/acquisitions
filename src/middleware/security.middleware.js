import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest'; // Default to 'guest' if no user is
    let limit;
    let message;

    switch (role) {
      case 'admin':
        limit = 20; // Admins can make 20 requests per interval
        message = 'Admin requests are allowed';
        break;
      case 'user':
        limit = 10; // Regular users can make 10 requests per interval
        message = 'User requests are allowed';
        break;
      case 'guest':
        limit = 5; // Guests can make 5 requests per interval
        message = 'Guest requests are allowed';
        break;
    }

    const client = aj.withRule(slidingWindow({ mode: 'LIVE', interval: '2s', max: limit, name: `${role}-rate-limit` }));
        
    const decision = await client.protect(req);
        
    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn(`Request blocked due to bot detection for role: ${role}`);    
      return res.status(403).json({ error: 'Request blocked due to bot detection' });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn(`Request blocked due to shield detection for role: ${role}`);    
      return res.status(403).json({ error: 'Request blocked due to shield detection' });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn(`Request blocked due to rate limit for role: ${role}`);    
      return res.status(403).json({ error: 'Request blocked due to rate limit' });
    }

    next();

  } catch (error) {
    logger.error('Security middleware error:', error); // ← add this
    res.status(500).json({ error: 'Request blocked by security middleware' });
}
};

export default securityMiddleware;