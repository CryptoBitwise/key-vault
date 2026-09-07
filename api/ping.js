import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  try {
    await redis.set('keepalive', Date.now());
    const val = await redis.get('keepalive');
    res.status(200).json({ ok: true, ts: val });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
}
