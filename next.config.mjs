import { readFileSync, existsSync } from 'node:fs'

// This machine has machine-wide NEXT_PUBLIC_SUPABASE_* env vars pointing at
// an unrelated Supabase project. Next.js's default env loading never
// overrides pre-existing process.env values, so .env.local silently loses —
// force it to win for this project.
const envLocalPath = new URL('.env.local', import.meta.url)
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, 'utf8').split('\n')) {
    const match = /^([^#=\s][^=]*)=(.*)$/.exec(line.trim())
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['date-fns'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
}

export default nextConfig
