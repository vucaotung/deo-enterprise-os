import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Max redis reconnection attempts reached');
        return new Error('Max retries');
      }
      return retries * 50;
    },
  },
});

client.on('error', (err) => {
  console.error('Redis client error', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

export async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
}

export async function get(key: string) {
  return await client.get(key);
}

export async function set(key: string, value: string, options?: { EX?: number }) {
  return await client.set(key, value, options);
}

export async function del(key: string) {
  return await client.del(key);
}

export async function lpush(key: string, value: string) {
  return await client.lPush(key, value);
}

export async function lpop(key: string) {
  return await client.lPop(key);
}

export async function hgetall(key: string) {
  return await client.hGetAll(key);
}

export async function hset(key: string, field: string, value: string) {
  return await client.hSet(key, field, value);
}

export async function expire(key: string, seconds: number) {
  return await client.expire(key, seconds);
}

export async function closeRedis() {
  await client.quit();
}

export default client;
