'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

export default function LinkshellEditor({ id, initial }: { id: number; initial: { description: string; tags: string; recruiting: boolean } }) {
  const router = useRouter()
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setMsg('')
    setError('')
    const res = await fetch(`/api/linkshells/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description: fd.get('description'), tags: fd.get('tags'), recruiting: fd.get('recruiting') === 'on' })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setError(data.error ?? 'Could not save.')
    setMsg('Saved.')
    router.refresh()
  }
  return (
    <form className="panel panel-pad form" onSubmit={save}>
      <h3 style={{ margin: 0 }}>Edit linkshell page</h3>
      <p className="muted small" style={{ margin: 0 }}>You hold this linkshell, so you can describe it here.</p>
      <label className="field">
        Description
        <textarea name="description" maxLength={600} defaultValue={initial.description} />
      </label>
      <label className="field">
        Tags
        <input type="text" name="tags" maxLength={200} defaultValue={initial.tags} placeholder="e.g. social, endgame, north america" />
      </label>
      <label className="check">
        <input type="checkbox" name="recruiting" defaultChecked={initial.recruiting} /> We&apos;re recruiting
      </label>
      {error && <div className="notice bad">{error}</div>}
      {msg && <div className="notice good">{msg}</div>}
      <button className="btn btn-primary" type="submit">
        Save
      </button>
    </form>
  )
}
