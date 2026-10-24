'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, ReactNode, useState } from 'react'

export interface Field {
  name: string
  label: string
  type?: 'text' | 'password' | 'email' | 'checkbox' | 'hidden'
  autoComplete?: string
  maxLength?: number
  hint?: ReactNode
  value?: string
  required?: boolean
}

interface Props {
  endpoint: string
  fields: Field[]
  submit: string
  /** Where to go after success (router.push + refresh). */
  redirect?: string
  /** Shown after success when there's no redirect. */
  success?: string
  /** Clear the inputs after success. */
  reset?: boolean
}

export default function JsonForm({ endpoint, fields, submit, redirect, success, reset }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const body: Record<string, unknown> = {}
    for (const f of fields) body[f.name] = f.type === 'checkbox' ? fd.get(f.name) === 'on' : String(fd.get(f.name) ?? '')
    setBusy(true)
    setError('')
    setDone('')
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.ok === false) {
        setError(data.error ?? (res.status === 429 ? 'Too many attempts. Wait a minute and try again.' : 'Something went wrong. Try again.'))
        return
      }
      if (reset) form.reset()
      if (redirect) {
        router.push(redirect)
        router.refresh()
      } else {
        setDone(success ?? 'Saved.')
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {fields.map((f) =>
        f.type === 'hidden' ? (
          <input key={f.name} type="hidden" name={f.name} value={f.value ?? ''} />
        ) : f.type === 'checkbox' ? (
          <label key={f.name} className="check">
            <input type="checkbox" name={f.name} />
            <span>{f.label}</span>
          </label>
        ) : (
          <label key={f.name} className="field">
            {f.label}
            <input
              type={f.type ?? 'text'}
              name={f.name}
              defaultValue={f.value}
              autoComplete={f.autoComplete}
              maxLength={f.maxLength}
              required={f.required ?? true}
              spellCheck={false}
            />
            {f.hint && <span className="muted small">{f.hint}</span>}
          </label>
        )
      )}
      {error && <div className="notice bad">{error}</div>}
      {done && <div className="notice good">{done}</div>}
      <button className="btn btn-primary btn-lg" type="submit" disabled={busy}>
        {busy ? 'Please wait…' : submit}
      </button>
    </form>
  )
}
