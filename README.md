# VAULT

Encrypted password & API key manager. Single HTML file + one serverless function + Vercel KV.

## Deploy

1. Push to a private GitHub repo
2. Import to vercel.com
3. In your Vercel project → **Storage** tab → **Create KV Database** → **Connect to Project**
4. That's it. Vercel auto-injects the KV env vars and deploys.

## Local dev

Install Vercel CLI and link your project to pull env vars:
```bash
npm i -g vercel
vercel link
vercel env pull .env.local
npm i
vercel dev
```

## Security
- PIN never leaves the browser
- AES-256-GCM encryption with PBKDF2 key derivation (100k iterations)
- Only an encrypted blob is stored in KV — Vercel can't read your secrets
