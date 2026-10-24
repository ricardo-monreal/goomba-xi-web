import type { NextConfig } from 'next'

const filesUrl = process.env.FILES_URL ?? ''

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // mysql2 and nodemailer are Node-only; keep them out of the bundle.
  serverExternalPackages: ['mysql2', 'nodemailer', 'bcryptjs'],
  images: { unoptimized: true },
  async headers() {
    const csp = [
      "default-src 'self'",
      `img-src 'self' data: ${filesUrl}`.trim(),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
    return [{ source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: csp }] }]
  }
}

export default nextConfig
