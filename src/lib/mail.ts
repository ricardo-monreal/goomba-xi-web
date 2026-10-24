import 'server-only'
import { env } from './env'

/**
 * Sends a plain-text e-mail through SMTP_URL (e.g. smtps://user:pass@smtp.example.com:465).
 * Without SMTP_URL the message is written to the server log instead, so a fresh install
 * still works (an admin can copy a reset link from `goomba logs web`).
 */
export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (!env.smtpUrl) {
    console.log(`[mail] SMTP_URL not set; would send to ${to}: ${subject}\n${text}`)
    return
  }
  const nodemailer = await import('nodemailer')
  const transport = nodemailer.createTransport(env.smtpUrl)
  await transport.sendMail({ from: env.mailFrom, to, subject, text })
}
