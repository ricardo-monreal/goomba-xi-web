'use client'

import { useEffect, useState } from 'react'
import { formatCountdown, nextTransport, type Transport } from '@/lib/vana'

const KIND_LABEL: Record<string, string> = { airship: 'Airship', ship: 'Ship', barge: 'Barge', manaclipper: 'Manaclipper' }

export default function Transports({ transports }: { transports: Transport[] }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Route</th>
          <th>Status</th>
          <th>Departs in</th>
        </tr>
      </thead>
      <tbody>
        {transports.map((t) => {
          const n = now === null ? null : nextTransport(t, now)
          return (
            <tr key={t.id}>
              <td>
                <span className="tiny muted">{KIND_LABEL[t.kind] ?? t.kind}</span>
                <br />
                {t.from} → {t.to}
                {t.note ? <span className="muted small"> ({t.note})</span> : null}
              </td>
              <td className="small">{n === null ? '' : n.docked ? <span className="ok">Boarding</span> : <span className="muted">Docks in {formatCountdown(n.arriveInMs)}</span>}</td>
              <td className="num">{n === null ? '' : formatCountdown(n.departInMs)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
