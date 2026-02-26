import { kv } from "@vercel/kv";

export const config = { runtime: "edge" };

export default async function handler(req) {
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
