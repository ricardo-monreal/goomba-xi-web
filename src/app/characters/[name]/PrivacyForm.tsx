'use client'

import { useState } from 'react'

interface Privacy {
  hideProfile: boolean
  hideJobs: boolean
  hideOnline: boolean
}

const OPTIONS: { key: keyof Privacy; label: string; help: string }[] = [
  { key: 'hideProfile', label: 'Hide my profile', help: 'Leave this character out of searches and linkshell lists. Its page shows only the name.' },
  { key: 'hideJobs', label: 'Hide my jobs (anon)', help: 'Show ANON instead of your jobs and levels.' },
  { key: 'hideOnline', label: 'Hide my online status', help: 'Always appear offline on the website.' }
]

export default function PrivacyForm({ name, initial }: { name: string; initial: Privacy }) {
  const [p, setP] = useState(initial)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const toggle = async (key: keyof Privacy) => {
    const next = { ...p, [key]: !p[key] }
    setP(next)
    setMsg('')
    setError('')
    const res = await fetch(`/api/characters/${encodeURIComponent(name)}/privacy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(next)
    })
    if (res.ok) setMsg('Saved.')
    else {
      setP(p)
      setError((await res.json().catch(() => ({}))).error ?? 'Could not save.')
    }
  }

  return (
    <section className="panel" style={{ maxWidth: 640 }}>
      <div className="panel-head">
        <h3>Privacy</h3>
        {msg && <span className="ok small">{msg}</span>}
      </div>
      <div className="panel-body stack">
        {OPTIONS.map((o) => (
          <label key={o.key} className="check">
            <input type="checkbox" checked={p[o.key]} onChange={() => toggle(o.key)} />
            <span>
              <b style={{ color: 'var(--text)' }}>{o.label}</b>
              <br />
              <span className="muted small">{o.help}</span>
            </span>
          </label>
        ))}
        {error && <div className="notice bad">{error}</div>}
        <p className="muted small" style={{ margin: 0 }}>
          Inventory, auctions, delivery box and bazaar details are always private to you.
        </p>
      </div>
    </section>
  )
}
