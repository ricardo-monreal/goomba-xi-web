import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { clearSessionCookie, destroySession, SESSION_COOKIE } from '@/lib/auth'

// Plain form POST from the header's "Log out" button. Redirects to "/" on whatever address
// the visitor used (domain or IP), not SITE_URL.
export async function POST() {
  const jar = await cookies()
  await destroySession(jar.get(SESSION_COOKIE)?.value)
  await clearSessionCookie()
  return new NextResponse(null, { status: 303, headers: { Location: '/' } })
}
