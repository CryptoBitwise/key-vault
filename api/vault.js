import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
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
