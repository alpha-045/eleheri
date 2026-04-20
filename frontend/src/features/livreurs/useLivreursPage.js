import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { toast } from '../../lib/toast'
import { useAuth } from '../../auth/AuthContext'

function computeStableNumber(seed) {
  const s = String(seed || '0')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function fakePhone(seed) {
  const h = computeStableNumber(seed)
  const a = String((h % 900) + 100)
  const b = String(((h >>> 10) % 900) + 100)
  const c = String(((h >>> 20) % 90) + 10)
  const d = String(((h >>> 26) % 90) + 10)
  return `+212 ${a} ${b} ${c} ${d}`
}

function fakeCity(seed) {
  const list = ['Agdal, Rabat', 'Hay Riad, Rabat', 'Maarif, Casablanca', 'Guéliz, Marrakech', 'Centre, Tanger']
  const h = computeStableNumber(seed)
  return list[h % list.length]
}

function fakeVehicle(seed) {
  const h = computeStableNumber(seed)
  return h % 2 === 0 ? 'Moto' : 'Voiture'
}

function fakeRating(seed) {
  const h = computeStableNumber(seed)
  const v = 4.2 + ((h % 60) / 100)
  return Math.round(v * 100) / 100
}

function todayKey(d) {
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function useLivreursPage(search) {
  const { hasPermission, hasAnyPermission } = useAuth()

  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [commandes, setCommandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const needCommandes = hasAnyPermission(['commandes.view', 'commandes.edit', 'commandes.cancel'])
      const needRoles = hasPermission('utilisateurs.manage') || hasPermission('systeme.settings')

      const reqs = [apiFetch('/api/utilisateurs?per_page=1000')]
      if (needRoles) reqs.unshift(apiFetch('/api/roles?per_page=1000'))
      if (needCommandes) reqs.push(apiFetch('/api/commandes_vente?per_page=1000'))

      const res = await Promise.all(reqs)
      const rolesRes = needRoles ? res[0] : null
      const usersRes = needRoles ? res[1] : res[0]
      const commandesRes = needCommandes ? res[res.length - 1] : null

      const r = rolesRes ? (Array.isArray(rolesRes?.data) ? rolesRes.data : rolesRes?.data?.data || []) : []
      const u = Array.isArray(usersRes?.data) ? usersRes.data : usersRes?.data?.data || []
      const c = commandesRes ? (Array.isArray(commandesRes?.data) ? commandesRes.data : commandesRes?.data?.data || []) : []

      setRoles(r)
      setUsers(u)
      setCommandes(c)
    } catch (e) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }, [hasAnyPermission, hasPermission])

  useEffect(() => {
    if (!hasAnyPermission(['utilisateurs.view', 'utilisateurs.manage'])) return
    loadAll()
  }, [hasAnyPermission, loadAll])

  const livreurRoleId = useMemo(() => {
    const r = roles.find((x) => (x?.nom || '').toString().toLowerCase() === 'livreur')
    if (r?.id != null) return r.id
    const u = users.find((x) => (x?.role?.nom || '').toString().toLowerCase() === 'livreur')
    return u?.role_id ?? null
  }, [roles, users])

  const livreurs = useMemo(() => {
    const id = String(livreurRoleId ?? '')
    const list = users.filter((u) => {
      const rid = String(u?.role_id ?? u?.role?.id ?? '')
      const rname = (u?.role?.nom || '').toString().toLowerCase()
      if (id) return rid === id
      return rname === 'livreur'
    })
    const q = (search || '').toString().trim().toLowerCase()
    const filtered = !q
      ? list
      : list.filter((u) => {
          const name = `${u?.nom || ''} ${u?.prenom || ''}`.toLowerCase()
          const mail = (u?.email || '').toString().toLowerCase()
          return name.includes(q) || mail.includes(q)
        })

    return filtered.map((u) => {
      const vehicle = fakeVehicle(u.id)
      const rating = fakeRating(u.id)
      const online = !!u.actif && computeStableNumber(u.id) % 3 !== 0
      return {
        ...u,
        vehicle,
        rating,
        online,
        phone: fakePhone(u.id),
        location: fakeCity(u.id),
      }
    })
  }, [users, livreurRoleId, search])

  const statsByUserId = useMemo(() => {
    const map = new Map()
    for (const cmd of commandes) {
      const uid = cmd?.utilisateur_id != null ? String(cmd.utilisateur_id) : ''
      if (!uid) continue
      const cur = map.get(uid) || { active: 0, deliveredToday: 0 }
      const statut = (cmd?.statut || '').toString().toLowerCase()
      if (statut === 'en_attente' || statut === 'confirmée' || statut === 'confirmee') cur.active += 1
      const dt = cmd?.date_commande ? new Date(cmd.date_commande) : null
      if (dt && !Number.isNaN(dt.getTime())) {
        const isToday = todayKey(dt) === todayKey(new Date())
        if (isToday && (statut === 'payée' || statut === 'payee' || statut === 'livrée' || statut === 'livree')) cur.deliveredToday += 1
      }
      map.set(uid, cur)
    }
    return map
  }, [commandes])

  const headerStats = useMemo(() => {
    const online = livreurs.filter((l) => l.online).length
    let active = 0
    let deliveredToday = 0
    let ratingSum = 0
    for (const l of livreurs) {
      const s = statsByUserId.get(String(l.id)) || { active: 0, deliveredToday: 0 }
      active += s.active
      deliveredToday += s.deliveredToday
      ratingSum += Number(l.rating || 0)
    }
    const avg = livreurs.length ? ratingSum / livreurs.length : 0
    return { online, active, deliveredToday, avg: Math.round(avg * 100) / 100 }
  }, [livreurs, statsByUserId])

  async function submitUser(payload) {
    if (!livreurRoleId) return
    setSubmitting(true)
    setError('')
    try {
      const body = { ...payload }
      if (body.mot_de_passe == null) delete body.mot_de_passe

      if (editing?.id) {
        await apiFetch(`/api/utilisateurs/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast({ type: 'success', message: 'Livreur mis à jour.' })
      } else {
        await apiFetch('/api/utilisateurs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast({ type: 'success', message: 'Livreur ajouté.' })
      }

      setOpen(false)
      setEditing(null)
      await loadAll()
    } catch (e) {
      setError(e?.message || 'Erreur')
      toast({ type: 'error', message: e?.message || 'Erreur' })
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleting?.id) return
    setSubmitting(true)
    setError('')
    try {
      await apiFetch(`/api/utilisateurs/${deleting.id}`, { method: 'DELETE' })
      toast({ type: 'success', message: 'Livreur supprimé.' })
      setConfirmOpen(false)
      setDeleting(null)
      await loadAll()
    } catch (e) {
      setError(e?.message || 'Erreur')
      toast({ type: 'error', message: e?.message || 'Erreur' })
    } finally {
      setSubmitting(false)
    }
  }

  function openCreate() {
    if (!livreurRoleId) {
      toast({ type: 'error', message: "Rôle 'livreur' introuvable." })
      return
    }
    setEditing(null)
    setOpen(true)
  }

  function openEdit(u) {
    if (!hasPermission('utilisateurs.manage')) return
    setEditing(u)
    setOpen(true)
  }

  function askDelete(u) {
    setDeleting(u)
    setConfirmOpen(true)
  }

  return {
    hasPermission,
    hasAnyPermission,
    loading,
    error,
    submitting,
    open,
    setOpen,
    confirmOpen,
    setConfirmOpen,
    editing,
    setEditing,
    deleting,
    setDeleting,
    livreurs,
    livreurRoleId,
    statsByUserId,
    headerStats,
    openCreate,
    openEdit,
    askDelete,
    submitUser,
    confirmDelete
  }
}
