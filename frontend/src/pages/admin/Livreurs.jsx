import { useEffect, useMemo, useState } from 'react'
import { Bike, Car, LocateFixed, Trash2, UserPlus, UserRound } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import Alert from '../../components/Alert'
import { toast } from '../../lib/toast'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/users.css'
import '../../styles/livreurs.css'

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

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('fr-FR')
}

function todayKey(d) {
  const pad = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function UserModal({ open, roleId, initialValues, onClose, onSubmit }) {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [actif, setActif] = useState(true)

  useEffect(() => {
    if (!open) return
    setNom(initialValues?.nom ?? '')
    setPrenom(initialValues?.prenom ?? '')
    setEmail(initialValues?.email ?? '')
    setPassword('')
    setActif(initialValues?.actif != null ? !!initialValues.actif : true)
  }, [open, initialValues])

  if (!open) return null
  const isEdit = !!initialValues?.id
  const canSubmit = nom.trim() && email.trim() && (isEdit ? true : password.trim().length >= 6)

  function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({
      role_id: Number(roleId),
      nom: nom.trim(),
      prenom: prenom.trim() ? prenom.trim() : null,
      email: email.trim(),
      mot_de_passe: isEdit ? (password.trim() ? password.trim() : null) : password.trim(),
      actif,
    })
  }

  return (
    <div className="users-modal-overlay" onMouseDown={onClose}>
      <div className="users-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="users-modal-head">
          <div className="users-modal-title">{isEdit ? 'Modifier le livreur' : 'Ajouter un livreur'}</div>
          <button className="users-modal-x" type="button" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>

        <form className="users-modal-body" onSubmit={submit}>
          <label className="users-field">
            Adresse email
            <input className="users-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.com" />
          </label>

          <div className="users-row">
            <label className="users-field">
              Nom
              <input className="users-input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
            </label>
            <label className="users-field">
              Prénom
              <input className="users-input" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" />
            </label>
          </div>

          <label className="users-field">
            Mot de passe{isEdit ? ' (optionnel)' : ''}
            <input
              className="users-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Laisser vide pour ne pas changer' : 'Min 6 caractères'}
              type="password"
            />
          </label>

          <label className="users-active-line">
            <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
            <span>Livreur actif</span>
          </label>

          <div className="users-modal-actions">
            <button className="users-btn users-btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="users-btn users-btn-danger" type="submit" disabled={!canSubmit}>
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ open, title, description, onClose, onConfirm, disabled }) {
  if (!open) return null
  return (
    <div className="users-modal-overlay" onMouseDown={onClose}>
      <div className="users-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="users-modal-head">
          <div className="users-modal-title">{title}</div>
          <button className="users-modal-x" type="button" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="users-modal-body">
          <div className="users-field">{description}</div>
          <div className="users-modal-actions">
            <button className="users-btn users-btn-ghost" type="button" onClick={onClose} disabled={disabled}>
              Annuler
            </button>
            <button className="users-btn users-btn-danger" type="button" onClick={onConfirm} disabled={disabled}>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Livreurs() {
  const { hasPermission, hasAnyPermission } = useAuth()
  const outlet = useOutletContext() || {}
  const search = (outlet.search || outlet.searchQuery || '').toString()
  const setSearch = outlet.setSearch || outlet.setSearchQuery

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

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const needCommandes = hasAnyPermission(['commandes.view', 'commandes.edit', 'commandes.cancel'])
      const needRoles = hasPermission('utilisateurs.manage') || hasPermission('systeme.settings')

      const reqs = [apiFetch('/api/utilisateurs?per_page=200')]
      if (needRoles) reqs.unshift(apiFetch('/api/roles?per_page=200'))
      if (needCommandes) reqs.push(apiFetch('/api/commandes_vente?per_page=500'))

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
  }

  useEffect(() => {
    if (!hasAnyPermission(['utilisateurs.view', 'utilisateurs.manage'])) return
    loadAll()
  }, [])

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
    const q = search.trim().toLowerCase()
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

  function openMap(loc) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc || '')}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!hasAnyPermission(['utilisateurs.view', 'utilisateurs.manage'])) {
    return (
      <section className="content livreurs">
        <div className="users-empty">Accès refusé.</div>
      </section>
    )
  }

  return (
    <section className="content livreurs">
      <div className="livreurs-head">
        <div>
          <div className="livreurs-title">Livreurs</div>
          <div className="livreurs-sub">Suivre et gérer les livreurs</div>
        </div>
        <button className="livreurs-add" type="button" onClick={openCreate} disabled={submitting || !hasPermission('utilisateurs.manage')}>
          <UserPlus size={18} />
          Ajouter Livreur
        </button>
      </div>

      <Alert type="error" message={error} />

      <div className="livreurs-stats">
        <div className="livreurs-stat">
          <div className="livreurs-stat-label">Livreurs en ligne</div>
          <div className="livreurs-stat-value livreurs-stat-value-green">{headerStats.online}</div>
        </div>
        <div className="livreurs-stat">
          <div className="livreurs-stat-label">Commandes actives</div>
          <div className="livreurs-stat-value">{headerStats.active}</div>
        </div>
        <div className="livreurs-stat">
          <div className="livreurs-stat-label">Livrées aujourd&apos;hui</div>
          <div className="livreurs-stat-value livreurs-stat-value-red">{headerStats.deliveredToday}</div>
        </div>
        <div className="livreurs-stat">
          <div className="livreurs-stat-label">Note moyenne</div>
          <div className="livreurs-stat-value livreurs-stat-value-amber">{headerStats.avg} ★</div>
        </div>
      </div>

      <div className="livreurs-bar">
        <div className="livreurs-search">
          <input
            className="livreurs-search-input"
            placeholder="Rechercher des livreurs…"
            value={search}
            onChange={(e) => (setSearch ? setSearch(e.target.value) : null)}
          />
        </div>
      </div>

      <div className="livreurs-list">
        {loading ? <div className="users-empty">Loading…</div> : null}
        {!loading && livreurs.length === 0 ? <div className="users-empty">Aucun livreur</div> : null}

        {!loading
          ? livreurs.map((u) => {
              const full = `${u.nom || ''} ${u.prenom || ''}`.trim() || '—'
              const initials = full
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((x) => x[0]?.toUpperCase())
                .join('')

              const s = statsByUserId.get(String(u.id)) || { active: 0, deliveredToday: 0 }
              const VehicleIcon = u.vehicle === 'Moto' ? Bike : Car
              const statusClass = u.online ? 'livreurs-pill livreurs-pill-green' : 'livreurs-pill livreurs-pill-gray'
              const statusLabel = u.online ? 'En ligne' : 'Hors ligne'

              return (
                <div key={u.id} className="livreur-card">
                  <div className="livreur-left">
                    <div className="livreur-avatar">
                      <div className="livreur-avatar-in">{initials || 'L'}</div>
                      <span className={u.online ? 'livreur-dot livreur-dot-on' : 'livreur-dot'} />
                    </div>

                    <div className="livreur-info">
                      <div className="livreur-topline">
                        <div className="livreur-name">{full}</div>
                        <span className={statusClass}>{statusLabel}</span>
                        <span className="livreurs-pill livreurs-pill-outline">
                          <VehicleIcon size={14} />
                          {u.vehicle}
                        </span>
                      </div>

                      <div className="livreur-grid">
                        <div className="livreur-line">
                          <UserRound size={16} />
                          <span>{u.email}</span>
                        </div>
                        <div className="livreur-line">
                          <span>☎</span>
                          <span>{u.phone}</span>
                        </div>
                        <div className="livreur-line">
                          <span>📍</span>
                          <span>{u.location}</span>
                        </div>
                        <div className="livreur-line">
                          <span>📦</span>
                          <span>{s.active} commandes actives</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="livreur-metrics">
                    <div className="livreur-metric">
                      <div className="livreur-metric-value">{s.deliveredToday}</div>
                      <div className="livreur-metric-label">Livrées aujourd&apos;hui</div>
                    </div>
                    <div className="livreur-metric">
                      <div className="livreur-metric-value livreur-metric-amber">{u.rating}</div>
                      <div className="livreur-metric-label">Note</div>
                    </div>
                  </div>

                  <div className="livreur-actions">
                    <button
                      className="livreur-btn"
                      type="button"
                      onClick={() => openEdit(u)}
                      disabled={!hasPermission('utilisateurs.manage')}
                    >
                      Voir profil
                    </button>
                    <button className="livreur-btn livreur-btn-secondary" type="button" onClick={() => openMap(u.location)}>
                      <LocateFixed size={16} />
                      Localiser
                    </button>
                    <button
                      className="livreur-icon-danger"
                      type="button"
                      aria-label="Supprimer"
                      onClick={() => askDelete(u)}
                      disabled={submitting || !hasPermission('utilisateurs.manage')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })
          : null}
      </div>

      <UserModal
        open={open}
        roleId={livreurRoleId}
        initialValues={editing}
        onClose={() => {
          if (submitting) return
          setOpen(false)
          setEditing(null)
        }}
        onSubmit={submitUser}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Supprimer"
        description={`Supprimer "${deleting?.nom || ''} ${deleting?.prenom || ''}" ?`}
        onClose={() => {
          setConfirmOpen(false)
          setDeleting(null)
        }}
        onConfirm={confirmDelete}
        disabled={submitting}
      />
    </section>
  )
}
