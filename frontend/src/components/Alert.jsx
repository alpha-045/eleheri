import { useEffect, useMemo, useRef, useState } from 'react'

const subs = new Set()
let toastSeq = 1

export function toast(input) {
  const opts = typeof input === 'string' ? { message: input } : input || {}
  const message = (opts.message || '').toString()
  if (!message) return null

  const item = {
    id: String(toastSeq++),
    type: opts.type === 'success' ? 'success' : 'error',
    message,
    timeout: Number.isFinite(Number(opts.timeout)) ? Number(opts.timeout) : 3200,
  }

  for (const fn of subs) fn({ type: 'add', item })
  return item.id
}

export function ToastViewport() {
  const [items, setItems] = useState([])
  const timers = useRef(new Map())

  useEffect(() => {
    function onEvent(ev) {
      if (ev?.type !== 'add' || !ev.item) return
      const item = ev.item
      setItems((prev) => {
        const next = [...prev, item]
        return next.length > 4 ? next.slice(next.length - 4) : next
      })

      const t = window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== item.id))
        timers.current.delete(item.id)
      }, Math.max(800, item.timeout))
      timers.current.set(item.id, t)
    }

    subs.add(onEvent)
    return () => {
      subs.delete(onEvent)
      for (const t of timers.current.values()) window.clearTimeout(t)
      timers.current.clear()
    }
  }, [])

  function close(id) {
    const t = timers.current.get(id)
    if (t) window.clearTimeout(t)
    timers.current.delete(id)
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  if (!items.length) return null

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions removals">
      {items.map((it) => {
        const tone = it.type === 'success' ? 'banner-ok' : 'banner-err'
        const className = ['toast-item', 'banner', tone].join(' ')
        return (
          <div key={it.id} className={className}>
            <div className="toast-text">{it.message}</div>
            <button className="toast-x" type="button" onClick={() => close(it.id)} aria-label="Fermer">
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default function Alert({ type = 'error', message }) {
  const text = (message || '').toString()
  const tone = type === 'success' ? 'banner-ok' : type === 'error' ? 'banner-err' : ''
  const className = useMemo(() => ['banner', tone].filter(Boolean).join(' '), [tone])

  if (!text) return null
  return <div className={className}>{text}</div>
}
