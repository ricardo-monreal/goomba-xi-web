'use client'

import { useEffect, useState } from 'react'

interface Yell {
  id: number
  who: string
  type: string
  zone: string
  text: string
  at: string
}

export default function YellFeed() {
  const [yells, setYells] = useState<Yell[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let stop = false
    const load = async () => {
      try {
        const res = await fetch('/api/yells', { cache: 'no-store' })
        const data = await res.json()
        if (!stop) {
          setYells(data.yells ?? [])
          setError(false)
        }
      } catch {
        if (!stop) setError(true)
      }
    }
    load()
    const t = setInterval(load, 15000)
    return () => {
      stop = true
      clearInterval(t)
    }
  }, [])

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="muted small">{yells ? `${yells.length} messages in the last day` : 'Loading…'}</span>
        {error && <span className="error small">Couldn’t refresh; retrying.</span>}
      </div>
      <div className="yells">
        {yells?.length === 0 && <p className="muted">Quiet out there. Nobody has yelled in the last day.</p>}
        {yells?.map((y) => (
          <div key={y.id} className={`yell ${y.type === 'SHOUT' ? 'shout' : ''}`}>
            <span className="t">[{new Date(y.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>{' '}
            <span className="who" title={y.zone}>
              {y.who}
            </span>
            {y.type === 'SHOUT' ? <span className="muted"> (shout{y.zone ? `, ${y.zone}` : ''})</span> : null}: <span className="msg">{y.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
