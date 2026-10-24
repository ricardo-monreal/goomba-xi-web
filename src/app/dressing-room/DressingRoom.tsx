'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EQUIP_GRID, ERA_JOBS, JOB_NAMES, formatModValue } from '@/lib/ffxi'

interface Gear {
  id: number
  name: string
  icon: string
}
interface CharLoadout {
  charid: number
  name: string
  job: number
  level: number
  gear: Record<number, Gear>
}
interface Preset {
  id: number
  charid: number
  name: string
  job: number
  items: Record<string, number>
}

const SLOTS = [...EQUIP_GRID].sort((a, b) => a.slot - b.slot)

function Icon({ src }: { src: string }) {
  return (
    <span className="item-icon">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" /> : '◆'}
    </span>
  )
}

function SlotPicker({ slot, label, job, level, value, onChange }: { slot: number; label: string; job: number; level: number; value?: Gear; onChange: (g?: Gear) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<(Gear & { level: number })[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const res = await fetch(`/api/items/equippable?slot=${slot}&job=${job}&level=${level}&q=${encodeURIComponent(q)}`)
      const data = await res.json().catch(() => ({ items: [] }))
      setOptions(data.items ?? [])
    }, 200)
  }, [q, open, slot, job, level])

  return (
    <div className="slot-row">
      <span className="slot-name">{label}</span>
      <div className="suggest">
        <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
          {value && <Icon src={value.icon} />}
          <input
            type="search"
            value={open ? q : value?.name ?? ''}
            placeholder="None"
            onFocus={() => {
              setOpen(true)
              setQ('')
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onChange={(e) => setQ(e.target.value)}
            aria-label={`${label} item`}
          />
          {value && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(undefined)} aria-label={`Clear ${label}`}>
              ✕
            </button>
          )}
        </div>
        {open && options.length > 0 && (
          <ul>
            {options.map((o) => (
              <li key={o.id}>
                <button type="button" onMouseDown={() => onChange(o)}>
                  <Icon src={o.icon} />
                  <span>{o.name}</span>
                  <span className="muted small" style={{ marginLeft: 'auto' }}>
                    Lv. {o.level}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default function DressingRoom({ characters, signedIn }: { characters: CharLoadout[]; signedIn: boolean }) {
  const [charid, setCharid] = useState(characters[0]?.charid ?? 0)
  const char = characters.find((c) => c.charid === charid)
  const [job, setJob] = useState(char?.job || 1)
  const [level, setLevel] = useState(char?.level || 75)
  const [gear, setGear] = useState<Record<number, Gear>>(char?.gear ?? {})
  const [totals, setTotals] = useState<{ id: number; name: string; value: number }[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [presetName, setPresetName] = useState('')
  const [msg, setMsg] = useState('')

  const ids = useMemo(() => SLOTS.map((s) => gear[s.slot]?.id).filter(Boolean) as number[], [gear])

  useEffect(() => {
    fetch(`/api/items/stats?ids=${ids.join(',')}`)
      .then((r) => r.json())
      .then((d) => setTotals(d.totals ?? []))
      .catch(() => setTotals([]))
  }, [ids])

  const loadPresets = useCallback(() => {
    if (!signedIn) return
    fetch('/api/dressing-room/presets')
      .then((r) => r.json())
      .then((d) => setPresets(d.presets ?? []))
      .catch(() => {})
  }, [signedIn])
  useEffect(loadPresets, [loadPresets])

  const pickChar = (id: number) => {
    const c = characters.find((x) => x.charid === id)
    setCharid(id)
    if (c) {
      setJob(c.job || 1)
      setLevel(c.level || 75)
      setGear(c.gear)
    }
  }

  const applyPreset = async (p: Preset) => {
    const ids = Object.values(p.items)
    const next: Record<number, Gear> = {}
    for (const [slot, id] of Object.entries(p.items)) next[Number(slot)] = { id, name: `#${id}`, icon: '' }
    setGear(next)
    if (p.job) setJob(p.job)
    // Fetch display names and icons for the preset's items.
    const info = await fetch(`/api/items/names?ids=${ids.join(',')}`).then((r) => r.json()).catch(() => ({ items: {} }))
    setGear(Object.fromEntries(Object.entries(next).map(([s, g]) => [s, { ...g, ...(info.items?.[g.id] ?? {}) }])))
  }

  const savePreset = async () => {
    setMsg('')
    const res = await fetch('/api/dressing-room/presets', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ charid, name: presetName, job, items: Object.fromEntries(Object.entries(gear).map(([s, g]) => [s, g.id])) })
    })
    const d = await res.json().catch(() => ({}))
    setMsg(res.ok ? 'Preset saved.' : d.error ?? 'Could not save.')
    if (res.ok) {
      setPresetName('')
      loadPresets()
    }
  }

  const deletePreset = async (id: number) => {
    await fetch(`/api/dressing-room/presets?id=${id}`, { method: 'DELETE' })
    loadPresets()
  }

  return (
    <div className="dress">
      <div className="stack">
        <section className="panel panel-pad stack">
          {characters.length > 0 && (
            <label className="field">
              Character
              <select value={charid} onChange={(e) => pickChar(Number(e.target.value))}>
                {characters.map((c) => (
                  <option key={c.charid} value={c.charid}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="grid-2" style={{ gap: 10 }}>
            <label className="field">
              Job
              <select value={job} onChange={(e) => setJob(Number(e.target.value))}>
                {ERA_JOBS.map((j, i) => (
                  <option key={j} value={i + 1}>
                    {j} · {JOB_NAMES[j]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Level
              <input type="number" min={1} max={75} value={level} onChange={(e) => setLevel(Math.max(1, Math.min(75, Number(e.target.value) || 1)))} />
            </label>
          </div>
          <button type="button" className="btn btn-sm btn-ghost" onClick={() => setGear({})}>
            Clear all slots
          </button>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h3>Totals</h3>
          </div>
          <div className="panel-body">
            {totals.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                Pick some gear to see the combined stats.
              </p>
            ) : (
              <div className="stat-table">
                {totals.map((t) => (
                  <div key={t.id} style={{ display: 'contents' }}>
                    <span>{t.name}</span>
                    <span className="num">{formatModValue(t.id, t.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {signedIn && (
          <section className="panel">
            <div className="panel-head">
              <h3>Presets</h3>
            </div>
            <div className="panel-body stack">
              {characters.length === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>
                  Create a character in game to save presets.
                </p>
              ) : (
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <input type="text" maxLength={40} placeholder="Preset name" value={presetName} onChange={(e) => setPresetName(e.target.value)} aria-label="Preset name" />
                  <button type="button" className="btn btn-sm btn-primary" onClick={savePreset}>
                    Save
                  </button>
                </div>
              )}
              {msg && <span className="small muted">{msg}</span>}
              {presets.filter((p) => !charid || p.charid === charid).map((p) => (
                <div key={p.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <button type="button" className="btn btn-sm" onClick={() => applyPreset(p)}>
                    {p.name}
                  </button>
                  <span className="muted small">{ERA_JOBS[p.job - 1] ?? ''}</span>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => deletePreset(p.id)} aria-label={`Delete ${p.name}`}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h3>Gear</h3>
          <span className="muted small">
            {ERA_JOBS[job - 1]} · Lv. {level}
          </span>
        </div>
        <div className="panel-body">
          {SLOTS.map((s) => (
            <SlotPicker
              key={s.slot}
              slot={s.slot}
              label={s.label}
              job={job}
              level={level}
              value={gear[s.slot]}
              onChange={(g) =>
                setGear((prev) => {
                  const next = { ...prev }
                  if (g) next[s.slot] = g
                  else delete next[s.slot]
                  return next
                })
              }
            />
          ))}
        </div>
      </section>
    </div>
  )
}
