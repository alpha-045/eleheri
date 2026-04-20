import { CalendarDays, Pencil, Percent, Tag, Trash2, Truck } from 'lucide-react'

function formatDateRange(start, end) {
  const s = start ? new Date(start) : null
  const e = end ? new Date(end) : null
  const fmt = (d) =>
    d
      ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      : ''
  if (!s && !e) return ''
  if (s && e) return `${fmt(s)} - ${fmt(e)}`
  return fmt(s || e)
}

function PromoIcon({ promo }) {
  if (promo.type === 'pourcentage') return <Percent size={20} color="#ffffff" />
  if (Number(promo.value) === 0) return <Truck size={20} color="#ffffff" />
  return <Tag size={20} color="#ffffff" />
}

function PromoValue({ promo }) {
  if (promo.type === 'pourcentage') return `${Number(promo.value)}%`
  return `${Number(promo.value)} DH`
}

function PromoTypeLabel({ promo }) {
  if (promo.type === 'pourcentage') return 'Pourcentage'
  if (Number(promo.value) === 0) return 'Livraison gratuite'
  return 'Montant fixe'
}

export function ViewPromotions({ visible, openEdit, openDelete }) {
  return (
    <div className="promo-list">
      {visible.length === 0 ? <div className="products-empty">Aucune promotion</div> : null}

      {visible.map((p) => (
        <div key={p.id} className="promo-card">
          <div className="promo-left">
            <div className="promo-icon">
              <PromoIcon promo={p} />
            </div>
            <div className="promo-info">
              <div className="promo-title-row">
                <div className="promo-title">{p.name}</div>
                {p._status === 'active' ? <span className="promo-badge promo-badge-active">Active</span> : null}
                {p._status === 'scheduled' ? <span className="promo-badge promo-badge-scheduled">Programmée</span> : null}
                {p._status === 'expired' ? <span className="promo-badge promo-badge-expired">Expirée</span> : null}
              </div>
              <div className="promo-meta">
                {p.code_promo ? <span className="promo-code">{p.code_promo}</span> : null}
                <span className="promo-meta-item">
                  <CalendarDays size={14} />
                  {formatDateRange(p.start_date, p.end_date)}
                </span>
                {Number(p.panier_min) > 0 ? <span className="promo-meta-item">Min: {Number(p.panier_min)} DH</span> : null}
                <span className="promo-meta-item">{p._targetLabel}</span>
              </div>
            </div>
          </div>

          <div className="promo-right">
            <div className="promo-value">
              <div className="promo-value-big">
                <PromoValue promo={p} />
              </div>
              <div className="promo-value-sub">
                <PromoTypeLabel promo={p} />
              </div>
            </div>
            <div className="promo-actions">
              <button className="mini" type="button" onClick={() => openEdit(p)} aria-label="Edit">
                <Pencil size={16} color="#64748b" />
              </button>
              <button className="mini mini-danger" type="button" onClick={() => openDelete(p)} aria-label="Delete">
                <Trash2 size={16} color="#ef4444" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
