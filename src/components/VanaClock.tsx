'use client'

import { useEffect, useState } from 'react'
import { formatVanaClock, formatVanaDate, moon, vanaTime, WEEKDAYS } from '@/lib/vana'

/** Live Vana'diel clock. One Vana'diel minute is 2.4 Earth seconds. */
export default function VanaClock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1200)
    return () => clearInterval(t)
  }, [])
  if (now === null) return <div className={compact ? '' : 'clock'}>--:--</div>
  const v = vanaTime(now)
  const day = WEEKDAYS[v.weekday]
  const m = moon(now)
  if (compact) {
    return (
      <span className="num">
        {formatVanaClock(v)} · <span style={{ color: day.color }}>{day.name}</span> · {m.name} {m.percent}%
      </span>
    )
  }
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="clock">{formatVanaClock(v)}</div>
      <div className="row small">
        <span className="chip" style={{ borderColor: day.color, color: day.color }}>
          {day.name}
        </span>
        <span className="muted">{formatVanaDate(v)}</span>
        <span className="muted">
          {m.name} · {m.percent}% {m.waxing ? '↑' : '↓'}
        </span>
      </div>
    </div>
  )
}
