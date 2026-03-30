import { Redis } from "@upstash/redis";

function createRedisClient() {
  // Preferred envs for @upstash/redis REST client
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    return Redis.fromEnv();
  }

  // Fallback to Vercel KV env vars (commonly auto-injected when KV is connected)
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) {
    return new Redis({ url: kvUrl, token: kvToken });
  }

  // Last resort: keep same error shape but with a clearer message
  throw new Error(
    "Missing Upstash env vars. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN)."
  );
}

export const config = { runtime: "edge" };

export default async function handler(req) {
  // Debug: confirm URL is available in production logs (token intentionally not logged)
  console.log("UPSTASH_REDIS_REST_URL:", process.env.UPSTASH_REDIS_REST_URL);
  const kv = createRedisClient();

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    if (req.method === "GET") {
      const [data, pinHash] = await Promise.all([
        kv.get("vault:data"),
        kv.get("vault:pin"),
      ]);
      return new Response(JSON.stringify({ data: data ?? null, pinHash: pinHash ?? null }), { headers });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { action } = body;

      if (action === "init") {
        const existing = await kv.get("vault:pin");
        if (existing) {
          return new Response(JSON.stringify({ error: "Already initialized" }), { status: 400, headers });
        }
        await kv.set("vault:pin", body.pinHash);
        await kv.set("vault:data", "");
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      if (action === "save") {
        await kv.set("vault:data", body.data);
        return new Response(JSON.stringify({ ok: true }), { headers });
      }

      if (action === "reset") {
        await Promise.all([kv.del("vault:pin"), kv.del("vault:data")]);
        return new Response(JSON.stringify({ ok: true }), { headers });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
}
