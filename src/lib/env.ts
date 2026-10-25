import 'server-only'

function req(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable ${name} (see .env.example)`)
  return v
}

export const env = {
  get siteUrl() {
    return (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  },
  get filesUrl() {
    // Accept a bare address ("10.2.5.65"): without a scheme the links would be relative to this site.
    const raw = (process.env.FILES_URL ?? '').trim().replace(/\/+$/, '')
    return raw && !/^https?:\/\//i.test(raw) ? `http://${raw}` : raw
  },
  get db() {
    return {
      host: process.env.GAME_DB_HOST ?? '127.0.0.1',
      port: Number(process.env.GAME_DB_PORT ?? 3306),
      user: req('GAME_DB_USER'),
      password: req('GAME_DB_PASSWORD'),
      gameDb: process.env.GAME_DB_NAME ?? 'xidb',
      webDb: process.env.WEB_DB_NAME ?? 'goomba_web'
    }
  },
  get sessionSecret() {
    return req('SESSION_SECRET')
  },
  get gameApi() {
    return (process.env.GAME_HTTP_API ?? 'http://127.0.0.1:8088').replace(/\/$/, '')
  },
  get smtpUrl() {
    return process.env.SMTP_URL ?? ''
  },
  get mailFrom() {
    return process.env.MAIL_FROM ?? 'Goomba XI <no-reply@localhost>'
  },
  get discordUrl() {
    return process.env.DISCORD_URL ?? ''
  },
  get secureCookies() {
    return this.siteUrl.startsWith('https://')
  }
}
