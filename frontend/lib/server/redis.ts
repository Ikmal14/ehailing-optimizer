import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redisClient?: Redis };

function createClient() {
  const client = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 200, 3000),
    tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
  });
  client.on('error', (e) => console.error('[Redis]', e.message));
  return client;
}

export const redis =
  globalForRedis.redisClient ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redisClient = redis;

export default redis;
