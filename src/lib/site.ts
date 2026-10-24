import 'server-only'
import { env } from './env'

export const SITE_NAME = 'Goomba XI'
export const SITE_TAGLINE = 'A classic Level 75 FINAL FANTASY XI private server.'

/** Social links shown in the header and footer; empty ones are hidden. */
export function socialLinks(): { label: string; url: string }[] {
  return [
    { label: 'Discord', url: env.discordUrl },
    { label: 'YouTube', url: process.env.YOUTUBE_URL ?? '' },
    { label: 'X', url: process.env.X_URL ?? '' }
  ].filter((l) => l.url)
}

/**
 * Launcher downloads on the file server. The launcher repository's release script uploads
 * each build here under these fixed names (see its README, "Publishing a release").
 */
export function downloads() {
  const base = env.filesUrl ? `${env.filesUrl}/launcher` : ''
  return {
    windows: base ? `${base}/GoombaXI-Setup.exe` : '',
    linux: base ? `${base}/GoombaXI.AppImage` : ''
  }
}

export const wikiUrl = (): string => process.env.WIKI_URL ?? ''
