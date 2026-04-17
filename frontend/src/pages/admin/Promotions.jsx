import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { CalendarDays, Pencil, Percent, Plus, Tag, Trash2, Truck, X } from 'lucide-react'
import Alert from '../../components/Alert'
import '../../styles/promotions.css'

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

function getStatus(promo) {
  const now = new Date()
  const start = promo.start_date ? new Date(promo.start_date) : null
  const end = promo.end_date ? new Date(promo.end_date) : null

  if (!promo.is_active) return 'expired'
  if (start && now < start) return 'scheduled'
  if (end && now > end) return 'expired'
  return 'active'
}

function PromoModal({ open, onClose, onSubmit, initial, targets }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState('pourcentage')
  const [value, setValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minPanier, setMinPanier] = useState('')
  const [targetType, setTargetType] = useState('category')
  const [targetId, setTargetId] = useState('')

  const canSubmit = useMemo(() => {
    return name.trim() && value !== '' && startDate && endDate && targetType && targetId
  }, [name, value, startDate, endDate, targetType, targetId])

  useEffect(() => {
    if (!open) return
    const p = initial || null
    setName(p?.name || '')
    setCode(p?.code_promo || '')
    setType(p?.type || 'pourcentage')
    setValue(p?.value != null ? String(p.value) : '')
    setStartDate(p?.start_date || '')
    setEndDate(p?.end_date || '')
    setMinPanier(p?.panier_min != null ? String(p.panier_min) : '')
    setTargetType(p?.target_type || 'category')
    setTargetId(p?.target_id != null ? String(p.target_id) : '')
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const list = targets[targetType] || []
    if (!list.length) {
      setTargetId('')
      return
    }
    if (!targetId) setTargetId(String(list[0].id))
  }, [open, targetType])

  if (!open) return null

  function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({
      id: initial?.id,
      name: name.trim(),
      code_promo: code.trim() || null,
      type,
      value: Number(value),
      panier_min: minPanier === '' ? 0 : Number(minPanier),
      start_date: startDate,
      end_date: endDate,
      target_type: targetType,
      target_id: Number(targetId),
      is_active: true,
    })
  }

  const title = initial ? 'Modifier la promotion' : 'Créer une nouvelle promotion'

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="promo-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{title}</div>
          <button className="modal-x" type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <form className="promo-form" onSubmit={submit}>
          <div className="promo-form-left">
            <label className="form-label">
              Nom de la promotion
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Promotion Printemps" />
            </label>

            <label className="form-label">
              Code promo
              <input className="form-input form-input-muted" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: SPRING25" />
            </label>

            <label className="form-label">
              Type de promotion
              <div className="select-wrap">
                <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="pourcentage">Pourcentage</option>
                  <option value="montant_fixe">Montant fixe</option>
                </select>
              </div>
            </label>

            <label className="form-label">
              {type === 'pourcentage' ? 'Pourcentage (%)' : 'Montant (DH)'}
              <input className="form-input form-input-muted" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="25" />
            </label>

            <div className="form-grid">
              <label className="form-label">
                Date début
                <input className="form-input form-input-muted" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>
              <label className="form-label">
                Date fin
                <input className="form-input form-input-muted" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </label>
            </div>

            <label className="form-label">
              Panier minimum (DH)
              <input className="form-input form-input-muted" inputMode="decimal" value={minPanier} onChange={(e) => setMinPanier(e.target.value)} placeholder="200" />
            </label>

            <label className="form-label">
              Appliquer à
              <div className="form-grid">
                <div className="select-wrap">
                  <select className="form-select" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                    <option value="category">Catégorie</option>
                    <option value="article">Produit</option>
                    <option value="client">Client</option>
                  </select>
                </div>
                <div className="select-wrap">
                  <select className="form-select" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                    {(targets[targetType] || []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </label>

            <div className="modal-foot">
              <button className="btn-ghost" type="button" onClick={onClose}>
                Annuler
              </button>
              <button className="btn-primary" type="submit" disabled={!canSubmit}>
                {initial ? 'Enregistrer' : 'Créer Promotion'}
              </button>
            </div>
          </div>

          <div className="promo-form-right">
            <div className="promo-preview">
              <div className="promo-preview-title">Aperçu</div>
              <div className="promo-preview-box">
                <Tag size={26} color="#94a3b8" />
                <div className="promo-preview-text">L'aperçu s'affichera ici</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel }) {
  if (!open) return null
  return (
    <div className="modal-overlay-confirmpromo"  onMouseDown={onClose}>
      <div className=" confirm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="confirm-title">{title}</div>
        <div className="confirm-desc">{description}</div>
        <div className="confirm-actions">
          <button className="btn-ghost" type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="btn-primary" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Promotions() {
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [promos, setPromos] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const [targets, setTargets] = useState({ category: [], article: [], client: [] })

  async function load() {
    setError('')
    setLoading(true)
    try {
      const [promosRes, categoriesRes, articlesRes, clientsRes] = await Promise.all([
        apiFetch('/api/promotions?per_page=200'),
        apiFetch('/api/categories?per_page=200'),
        apiFetch('/api/articles?per_page=200'),
        apiFetch('/api/clients?per_page=200'),
      ])

      const listPromos = Array.isArray(promosRes?.data) ? promosRes.data : promosRes?.data?.data || []
      setPromos(listPromos)

      const cats = Array.isArray(categoriesRes?.data) ? categoriesRes.data : categoriesRes?.data?.data || []
      const arts = Array.isArray(articlesRes?.data) ? articlesRes.data : articlesRes?.data?.data || []
      const cls = Array.isArray(clientsRes?.data) ? clientsRes.data : clientsRes?.data?.data || []

      setTargets({
        category: cats.map((c) => ({ id: c.id, label: c.nom })),
        article: arts.map((a) => ({ id: a.id, label: a.nom })),
        client: cls.map((c) => ({ id: c.id, label: c.nom })),
      })
    } catch (e) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const enriched = useMemo(() => {
    const byType = {
      category: new Map(targets.category.map((t) => [String(t.id), t.label])),
      article: new Map(targets.article.map((t) => [String(t.id), t.label])),
      client: new Map(targets.client.map((t) => [String(t.id), t.label])),
    }

    return promos.map((p) => {
      const label = byType[p.target_type]?.get(String(p.target_id)) || `${p.target_type} #${p.target_id}`
      return { ...p, _targetLabel: label, _status: getStatus(p) }
    })
  }, [promos, targets])

  const visible = useMemo(() => {
    return enriched.filter((p) => p._status === tab)
  }, [enriched, tab])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditing(p)
    setModalOpen(true)
  }

  function openDelete(p) {
    setDeleting(p)
    setConfirmOpen(true)
  }

  async function savePromotion(payload) {
    const method = payload.id ? 'PATCH' : 'POST'
    const url = payload.id ? `/api/promotions/${payload.id}` : '/api/promotions'

    await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setModalOpen(false)
    await load()
  }

  async function confirmDelete() {
    if (!deleting) return
    await apiFetch(`/api/promotions/${deleting.id}`, { method: 'DELETE' })
    setConfirmOpen(false)
    setDeleting(null)
    await load()
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

  return (
    <section className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Promotions</div>
          <div className="page-subtitle">Gérer les offres et codes promo</div>
        </div>
        <button className="primary primary-pill" type="button" onClick={openCreate}>
          <Plus size={16} />
          Créer Promotion
        </button>
      </div>

      <div className="promo-tabs">
        <button className={tab === 'active' ? 'promo-tab promo-tab-active' : 'promo-tab'} type="button" onClick={() => setTab('active')}>
          Actives
        </button>
        <button className={tab === 'scheduled' ? 'promo-tab promo-tab-active' : 'promo-tab'} type="button" onClick={() => setTab('scheduled')}>
          Programmées
        </button>
        <button className={tab === 'expired' ? 'promo-tab promo-tab-active' : 'promo-tab'} type="button" onClick={() => setTab('expired')}>
          Expirées
        </button>
      </div>

      <Alert type="error" message={error} />

      <div className="promo-list">
        {loading ? <div className="products-empty">Loading…</div> : null}
        {!loading && visible.length === 0 ? <div className="products-empty">Aucune promotion</div> : null}

        {!loading
          ? visible.map((p) => (
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
            ))
          : null}
      </div>

      <PromoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={savePromotion}
        initial={editing}
        targets={targets}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false)
          setDeleting(null)
        }}
        onConfirm={confirmDelete}
        title="Êtes-vous sûr ?"
        description={
          deleting ? `Cette action est irréversible. Cela supprimera définitivement la promotion "${deleting.name}".` : ''
        }
        confirmLabel="Supprimer"
      />
    </section>
  )
}
