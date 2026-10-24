import 'server-only'

const sjis = new TextDecoder('shift_jis', { fatal: false })
const AUTO_TRANSLATE = '«…»'

/**
 * Turns a raw FFXI chat message from audit_chat into display text: decodes Shift-JIS,
 * replaces auto-translate phrases (0xFD … 0xFD) with a marker, and drops control codes.
 */
export function chatText(raw: Buffer | string | null): string {
  if (raw === null) return ''
  const bytes = typeof raw === 'string' ? Buffer.from(raw, 'latin1') : raw
  let out = ''
  let run: number[] = []
  const flush = () => {
    if (run.length) out += sjis.decode(Uint8Array.from(run))
    run = []
  }
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]
    if (b === 0xfd) {
      const end = bytes.indexOf(0xfd, i + 1)
      if (end > i && end - i <= 6) {
        flush()
        out += AUTO_TRANSLATE
        i = end
        continue
      }
    }
    if (b === 0x1e || b === 0x1f) {
      i++ // colour code and its argument
      continue
    }
    if (b < 0x20 || b === 0x7f) continue
    run.push(b)
  }
  flush()
  return out.trim()
}
