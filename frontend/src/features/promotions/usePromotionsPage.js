import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'

function getStatus(promo) {
  const now = new Date()
  const start = promo.start_date ? new Date(promo.start_date) : null
  const end = promo.end_date ? new Date(promo.end_date) : null

  if (!promo.is_active) return 'expired'
  if (start && now < start) return 'scheduled'
  if (end && now > end) return 'expired'
  return 'active'
}

export function usePromotionsPage() {
  const [tab, setTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [promos, setPromos] = useState([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const [targets, setTargets] = useState({ category: [], article: [], client: [] })

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [promosRes, categoriesRes, articlesRes, clientsRes] = await Promise.all([
        apiFetch('/api/promotions?per_page=1000'),
        apiFetch('/api/categories?per_page=1000'),
        apiFetch('/api/articles?per_page=1000'),
        apiFetch('/api/clients?per_page=1000'),
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
  }, [])

  useEffect(() => {
    load()
  }, [load])

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

    try {
      await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setModalOpen(false)
      await load()
    } catch (e) {
      setError(e?.message || 'Erreur saving promotion')
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await apiFetch(`/api/promotions/${deleting.id}`, { method: 'DELETE' })
      setConfirmOpen(false)
      setDeleting(null)
      await load()
    } catch (e) {
      setError(e?.message || 'Erreur deleting promotion')
    }
  }

  return {
    tab,
    setTab,
    loading,
    error,
    promos,
    modalOpen,
    setModalOpen,
    editing,
    confirmOpen,
    setConfirmOpen,
    deleting,
    setDeleting,
    targets,
    visible,
    openCreate,
    openEdit,
    openDelete,
    savePromotion,
    confirmDelete,
  }
}
