import 'server-only'
import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { gameExec, gameOne, gameTransaction, webExec, webOne } from './db'
import { env } from './env'

export const SESSION_COOKIE = 'gxi_session'
const WEB_SESSION_DAYS = 30
const LAUNCHER_SESSION_DAYS = 90
/** Launch tokens are single use; xiloader must use one within this time. */
const LAUNCH_TOKEN_MINUTES = 5

const ACCOUNT_NORMAL = 0x01
const ACCOUNT_BANNED = 0x02
export const PRIV_ADMIN = 0x02

export const RULES_VERSION = '2026-10'

export interface Account {
  id: number
  login: string
  email: string
  status: number
  priv: number
}

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex')
const newToken = (): string => randomBytes(32).toString('hex')

// ---- Validation (same limits the login server enforces) ------------------------------------

export function validateUsername(login: string): string | null {
  if (!/^[A-Za-z0-9]{3,16}$/.test(login)) return 'Usernames are 3 to 16 letters or digits.'
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters for your password.'
  if (password.length > 32) return 'Passwords can be at most 32 characters (a limit of the game login).'
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f]/.test(password)) return 'Passwords can’t contain control characters.'
  return null
}

export function validateEmail(email: string): string | null {
  if (email.length > 64 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid e-mail address.'
  return null
}

export async function clientIp(): Promise<string> {
  const h = await headers()
  return (h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? '').trim().slice(0, 45)
}

// ---- Sign in ----------------------------------------------------------------------------------

const MAX_FAILURES_PER_LOGIN = 8
const MAX_FAILURES_PER_IP = 30
const FAILURE_WINDOW_MIN = 15

export type SignInResult = { ok: true; account: Account } | { ok: false; error: string }

export async function verifyCredentials(login: string, password: string, ip: string): Promise<SignInResult> {
  if (!login || !password) return { ok: false, error: 'Enter your username and password.' }

  const throttled = await webOne<{ byLogin: number; byIp: number }>(
    `SELECT
       SUM(login = ? AND failed_at > NOW() - INTERVAL ${FAILURE_WINDOW_MIN} MINUTE) AS byLogin,
       SUM(ip = ? AND failed_at > NOW() - INTERVAL ${FAILURE_WINDOW_MIN} MINUTE) AS byIp
     FROM login_failures WHERE failed_at > NOW() - INTERVAL ${FAILURE_WINDOW_MIN} MINUTE`,
    [login.slice(0, 16), ip]
  )
  if (Number(throttled?.byLogin ?? 0) >= MAX_FAILURES_PER_LOGIN || Number(throttled?.byIp ?? 0) >= MAX_FAILURES_PER_IP) {
    return { ok: false, error: `Too many failed attempts. Try again in ${FAILURE_WINDOW_MIN} minutes.` }
  }

  const row = await gameOne<{ id: number; login: string; password: string; current_email: string; status: number; priv: number }>(
    'SELECT id, login, password, current_email, status, priv FROM accounts WHERE login = ? LIMIT 1',
    [login]
  )
  const hash = row?.password ?? ''
  const valid = /^\$2[abxy]\$/.test(hash) && (await bcrypt.compare(password, hash))
  if (!row || !valid) {
    await webExec('INSERT INTO login_failures (login, ip) VALUES (?, ?)', [login.slice(0, 16), ip])
    return { ok: false, error: 'Wrong username or password.' }
  }
  if (row.status & ACCOUNT_BANNED || !(row.status & ACCOUNT_NORMAL)) {
    return { ok: false, error: 'This account is suspended. Contact the staff on Discord if you think this is a mistake.' }
  }
  await webExec('DELETE FROM login_failures WHERE login = ?', [login.slice(0, 16)])
  return { ok: true, account: { id: row.id, login: row.login, email: row.current_email, status: row.status, priv: row.priv } }
}

// ---- Sessions ---------------------------------------------------------------------------------

export async function createSession(accid: number, kind: 'web' | 'launcher', ip: string, userAgent: string): Promise<string> {
  const token = newToken()
  const days = kind === 'web' ? WEB_SESSION_DAYS : LAUNCHER_SESSION_DAYS
  await webExec(
    `INSERT INTO sessions (token_hash, accid, kind, expires_at, ip, user_agent)
     VALUES (?, ?, ?, NOW() + INTERVAL ${days} DAY, ?, ?)`,
    [sha256(token), accid, kind, ip, userAgent.slice(0, 255)]
  )
  // Housekeeping: drop expired sessions now and then.
  if (Math.random() < 0.05) await webExec('DELETE FROM sessions WHERE expires_at < NOW()')
  return token
}

export async function accountForToken(token: string | undefined | null, kind?: 'web' | 'launcher'): Promise<Account | null> {
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null
  const s = await webOne<{ accid: number; kind: string }>(
    'SELECT accid, kind FROM sessions WHERE token_hash = ? AND expires_at > NOW()',
    [sha256(token)]
  )
  if (!s || (kind && s.kind !== kind)) return null
  const a = await gameOne<{ id: number; login: string; current_email: string; status: number; priv: number }>(
    'SELECT id, login, current_email, status, priv FROM accounts WHERE id = ?',
    [s.accid]
  )
  if (!a || a.status & ACCOUNT_BANNED) return null
  webExec('UPDATE sessions SET last_seen = NOW() WHERE token_hash = ?', [sha256(token)]).catch(() => {})
  return { id: a.id, login: a.login, email: a.current_email, status: a.status, priv: a.priv }
}

export async function destroySession(token: string | undefined | null): Promise<void> {
  if (token) await webExec('DELETE FROM sessions WHERE token_hash = ?', [sha256(token)])
}

/** The signed-in account for the current page or route handler, from the session cookie. */
export async function currentAccount(): Promise<Account | null> {
  const jar = await cookies()
  return accountForToken(jar.get(SESSION_COOKIE)?.value, 'web')
}

/**
 * Whether the browser reached us over HTTPS. Browsers silently drop Secure cookies on plain-http
 * pages, so the flag must follow the real request (nginx sends X-Forwarded-Proto), not SITE_URL:
 * otherwise opening the site by IP or before the certificate exists makes sign-in fail silently.
 */
async function requestIsHttps(): Promise<boolean> {
  const h = await headers()
  const proto = (h.get('x-forwarded-proto') ?? '').split(',')[0].trim().toLowerCase()
  if (proto) return proto === 'https'
  return env.secureCookies
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: await requestIsHttps(),
    sameSite: 'lax',
    path: '/',
    maxAge: WEB_SESSION_DAYS * 86400
  })
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

/** Bearer token from the launcher's Authorization header. */
export function bearerToken(req: Request): string | null {
  const h = req.headers.get('authorization') ?? ''
  const m = /^Bearer ([0-9a-f]{64})$/.exec(h)
  return m ? m[1] : null
}

// ---- Registration and passwords --------------------------------------------------------------

export async function registerAccount(login: string, password: string, email: string, ip: string): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  const problem = validateUsername(login) ?? validatePassword(password) ?? validateEmail(email)
  if (problem) return { ok: false, error: problem }

  const hash = await bcrypt.hash(password, 10)
  try {
    const id = await gameTransaction(async (conn) => {
      // Serialize registrations so two at once can't pick the same id.
      const [lock] = await conn.query<import('mysql2').RowDataPacket[]>("SELECT GET_LOCK('goomba_register', 10) AS got")
      if (!lock[0]?.got) throw new Error('busy')
      try {
        const [taken] = await conn.query<import('mysql2').RowDataPacket[]>('SELECT id FROM accounts WHERE login = ?', [login])
        if (taken.length) throw new Error('taken')
        const [emailTaken] = await conn.query<import('mysql2').RowDataPacket[]>(
          'SELECT id FROM accounts WHERE current_email = ? OR registration_email = ?',
          [email, email]
        )
        if (emailTaken.length) throw new Error('email')
        // Same id scheme as the login server: max + 1, starting at 1000.
        const [max] = await conn.query<import('mysql2').RowDataPacket[]>('SELECT COALESCE(MAX(id), 0) AS m FROM accounts')
        const newId = Math.max(Number(max[0].m) + 1, 1000)
        await conn.execute(
          `INSERT INTO accounts (id, login, password, current_email, registration_email, timecreate, timelastmodify, status, priv)
           VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?, 1)`,
          [newId, login, hash, email, email, ACCOUNT_NORMAL]
        )
        return newId
      } finally {
        await conn.query("SELECT RELEASE_LOCK('goomba_register')")
      }
    })
    await webExec(
      'INSERT INTO account_meta (accid, rules_version, agreed_at, created_ip) VALUES (?, ?, NOW(), ?) ON DUPLICATE KEY UPDATE rules_version = VALUES(rules_version)',
      [id, RULES_VERSION, ip]
    )
    return { ok: true, id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg === 'taken') return { ok: false, error: 'That username is already taken.' }
    if (msg === 'email') return { ok: false, error: 'An account with that e-mail address already exists. Use “Forgot password” to get into it.' }
    if (msg === 'busy') return { ok: false, error: 'The server is busy. Try again in a moment.' }
    throw e
  }
}

export async function setPassword(accid: number, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 10)
  await gameExec('UPDATE accounts SET password = ?, timelastmodify = NOW() WHERE id = ?', [hash, accid])
  // Changing the password signs out every other device.
  await webExec('DELETE FROM sessions WHERE accid = ?', [accid])
}

export async function setEmail(accid: number, email: string): Promise<void> {
  await gameExec('UPDATE accounts SET current_email = ?, timelastmodify = NOW() WHERE id = ?', [email, accid])
}

export async function createPasswordReset(email: string): Promise<{ login: string; token: string } | null> {
  const a = await gameOne<{ id: number; login: string; status: number }>(
    'SELECT id, login, status FROM accounts WHERE current_email = ? LIMIT 1',
    [email]
  )
  if (!a || a.status & ACCOUNT_BANNED) return null
  const token = newToken()
  await webExec('DELETE FROM password_resets WHERE accid = ? OR expires_at < NOW()', [a.id])
  await webExec('INSERT INTO password_resets (token_hash, accid, expires_at) VALUES (?, ?, NOW() + INTERVAL 1 HOUR)', [sha256(token), a.id])
  return { login: a.login, token }
}

export async function consumePasswordReset(token: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const problem = validatePassword(password)
  if (problem) return { ok: false, error: problem }
  if (!/^[0-9a-f]{64}$/.test(token)) return { ok: false, error: 'This reset link is invalid.' }
  const r = await webOne<{ accid: number }>('SELECT accid FROM password_resets WHERE token_hash = ? AND expires_at > NOW()', [sha256(token)])
  if (!r) return { ok: false, error: 'This reset link has expired. Ask for a new one.' }
  await webExec('DELETE FROM password_resets WHERE accid = ?', [r.accid])
  await setPassword(r.accid, password)
  return { ok: true }
}

// ---- Launch tokens ---------------------------------------------------------------------------

/**
 * Mints a single-use launch token for xiloader ("login_token"). The login server (goomba-xi-server/patches)
 * looks it up by SHA-256 in accounts_login_tokens and deletes it when used.
 */
export async function mintLaunchToken(accid: number): Promise<{ token: string; expiresInSeconds: number }> {
  const token = newToken()
  await gameExec('DELETE FROM accounts_login_tokens WHERE accid = ? OR expires < NOW()', [accid])
  await gameExec(
    `INSERT INTO accounts_login_tokens (token, accid, expires) VALUES (?, ?, NOW() + INTERVAL ${LAUNCH_TOKEN_MINUTES} MINUTE)`,
    [sha256(token), accid]
  )
  return { token, expiresInSeconds: LAUNCH_TOKEN_MINUTES * 60 }
}
