const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 3000),
  lazyConnect: true,
});

redis.on('connect',    () => console.log('[Redis] Connected'));
redis.on('error', (e) => console.error('[Redis] Error:', e.message));

module.exports = redis;
