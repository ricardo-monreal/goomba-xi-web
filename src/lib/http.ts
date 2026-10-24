import 'server-only'
import { NextResponse } from 'next/server'
import { env } from './env'

export const json = (data: unknown, status = 200): NextResponse => NextResponse.json(data, { status })
export const fail = (error: string, status = 400): NextResponse => NextResponse.json({ ok: false, error }, { status })

/**
 * Website forms send JSON from our own pages. Rejecting other content types and foreign
 * Origins stops other sites from submitting them on a signed-in visitor's behalf.
 */
export function sameOriginJson(req: Request): boolean {
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) return false
  const origin = req.headers.get('origin')
  if (!origin) return true // same-origin fetches from older browsers, server-side tools
  try {
    const o = new URL(origin)
    const site = new URL(env.siteUrl)
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? ''
    return o.host === site.host || o.host === host
  } catch {
    return false
  }
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

export const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.slice(0, max) : '')
