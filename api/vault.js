import { Redis } from "@upstash/redis";

function getRedisRestConfig() {
  // Preferred on Vercel KV integrations
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) return { url: kvUrl, token: kvToken };

  // Fallback for plain Upstash REST env vars
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) return { url: upstashUrl, token: upstashToken };

  throw new Error(
    "Missing REST env vars: set KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN)."
  );
}

const redis = new Redis({
  ...getRedisRestConfig(),
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (req.method === "GET") {
      const pin = await redis.get("v:pin");
      const data = await redis.get("v:data");
      return res.json({ pin: pin ?? null, data: data ?? null });
    }

    if (req.method === "POST") {
      const { action, pin, data } = req.body;

      if (action === "init") {
        await redis.set("v:pin", pin);
        await redis.set("v:data", "");
        return res.json({ ok: true });
      }

      if (action === "save") {
        await redis.set("v:data", data);
        return res.json({ ok: true });
      }

      if (action === "reset") {
        await redis.del("v:pin");
        await redis.del("v:data");
        return res.json({ ok: true });
      }
    }

    res.status(404).json({ error: "not found" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
