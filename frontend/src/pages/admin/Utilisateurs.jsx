import { useEffect, useMemo, useState } from 'react'
import { Download, Filter, Pencil, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import Alert from '../../components/Alert'
import { toast } from '../../lib/toast'
import { CSVLink } from 'react-csv'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/users.css'

function RolePicker({ roles, value, onChange }) {
  return (
    <div className="users-role-grid">
      {roles.map((r) => {
        const selected = String(value) === String(r.id)
        const label = (r.nom || '').toString()
        const letter = label ? label.slice(0, 1).toUpperCase() : '?'
        return (
          <button
            key={r.id}
            type="button"
            className={selected ? 'users-role-card users-role-card-active' : 'users-role-card'}
            onClick={() => onChange?.(String(r.id))}
          >
            <div className={selected ? 'users-role-ico users-role-ico-active' : 'users-role-ico'}>{letter}</div>
            <div className="users-role-name">{label}</div>
            {selected ? <div className="users-role-check">✓</div> : null}
          </button>
        )
      })}
    </div>
  )
}

function UserModal({ open, mode, roles, initialValues, onClose, onSubmit }) {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [password, setPassword] = useState('')
  const [actif, setActif] = useState(true)

  useEffect(() => {
    if (!open) return
    setNom(initialValues?.nom ?? '')
    setPrenom(initialValues?.prenom ?? '')
    setEmail(initialValues?.email ?? '')
    setRoleId(initialValues?.role_id != null ? String(initialValues.role_id) : '')
    setPassword('')
    setActif(initialValues?.actif != null ? !!initialValues.actif : true)
  }, [open, initialValues])

  if (!open) return null

  const canSubmit = nom.trim() && email.trim() && roleId && (mode === 'edit' ? true : password.trim().length >= 6)

  function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({
      nom: nom.trim(),
      prenom: prenom.trim() ? prenom.trim() : null,
      email: email.trim(),
      role_id: Number(roleId),
      mot_de_passe: mode === 'edit' ? (password.trim() ? password.trim() : null) : password.trim(),
      actif,
    })
  }

  return (
    <div className="users-modal-overlay" onMouseDown={onClose}>
      <div className="users-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="users-modal-head">
          <div className="users-modal-title">{mode === 'edit' ? "Modifier un utilisateur" : 'Ajouter un utilisateur'}</div>
          <button className="users-modal-x" type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
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

          <div className="users-field">
            Rôle
            <RolePicker roles={roles} value={roleId} onChange={setRoleId} />
          </div>

          <label className="users-field">
            Mot de passe{mode === 'edit' ? ' (optionnel)' : ''}
            <input
              className="users-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'edit' ? 'Laisser vide pour ne pas changer' : 'Min 6 caractères'}
              type="password"
            />
          </label>

          <div className="users-note">
            Un email d&apos;invitation peut être envoyé plus tard. Pour l&apos;instant, définis un mot de passe.
          </div>

          <label className="users-active-line">
            <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
            <span>Utilisateur actif</span>
          </label>

          <div className="users-modal-actions">
            <button className="users-btn users-btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="users-btn users-btn-primary" type="submit" disabled={!canSubmit}>
              {mode === 'edit' ? 'Enregistrer' : 'Envoyer invitation'}
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
            <X size={18} />
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

export default function Utilisateurs({ fixedRole }) {
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

  const [roleFilter, setRoleFilter] = useState(fixedRole || 'all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
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

  const allowedRoles = useMemo(() => {
    const allowed = new Set(['agent', 'livreur'])
    return roles.filter((r) => allowed.has((r?.nom || '').toString().toLowerCase()))
  }, [roles])

  const allowedRoleByName = useMemo(() => {
    const map = new Map()
    for (const r of allowedRoles) map.set((r?.nom || '').toString().toLowerCase(), r)
    return map
  }, [allowedRoles])

  useEffect(() => {
    if (!fixedRole) return
    setRoleFilter(fixedRole)
  }, [fixedRole])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filter = (roleFilter || 'all').toString().toLowerCase()
    const allowedIds = new Set(allowedRoles.map((r) => String(r.id)))
    const status = (statusFilter || 'all').toString().toLowerCase()

    return users
      .filter((u) => allowedIds.has(String(u?.role_id ?? u?.role?.id ?? '')))
      .filter((u) => {
        const roleName = (u?.role?.nom || '').toString().toLowerCase()
        if (filter === 'all') return true
        return roleName === filter
      })
      .filter((u) => {
        if (status === 'all') return true
        return status === 'actif' ? !!u.actif : !u.actif
      })
      .filter((u) => {
        if (!q) return true
        const name = `${u?.nom || ''} ${u?.prenom || ''}`.toLowerCase()
        const mail = (u?.email || '').toString().toLowerCase()
        return name.includes(q) || mail.includes(q)
      })
  }, [users, allowedRoles, roleFilter, search])

  const statsByUserId = useMemo(() => {
    const map = new Map()
    for (const cmd of commandes) {
      const uid = cmd?.utilisateur_id != null ? String(cmd.utilisateur_id) : ''
      if (!uid) continue
      const cur = map.get(uid) || { count: 0, total: 0 }
      cur.count += 1
      cur.total += Number(cmd?.total ?? 0)
      map.set(uid, cur)
    }
    return map
  }, [commandes])

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    const fallbackRole = fixedRole && allowedRoleByName.get(String(fixedRole).toLowerCase())?.id
    setOpen(true)
    if (fallbackRole) setEditing({ role_id: fallbackRole })
  }

  function openEdit(u) {
    setModalMode('edit')
    setEditing(u)
    setOpen(true)
  }

  function askDelete(u) {
    setDeleting(u)
    setConfirmOpen(true)
  }

  async function submit(payload) {
    setSubmitting(true)
    setError('')
    try {
      const body = { ...payload }
      if (body.mot_de_passe == null) delete body.mot_de_passe

      if (modalMode === 'edit' && editing?.id) {
        await apiFetch(`/api/utilisateurs/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast({ type: 'success', message: 'Utilisateur mis à jour.' })
      } else {
        await apiFetch('/api/utilisateurs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast({ type: 'success', message: 'Utilisateur ajouté.' })
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
      toast({ type: 'success', message: 'Utilisateur supprimé.' })
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

  const pageTitle = fixedRole === 'agent' ? 'Agents' : fixedRole === 'livreur' ? 'Livreurs' : 'Utilisateurs'
  const pageSub = fixedRole ? 'Gestion des comptes' : "Gestion des agents et des livreurs"

  async function toggleActive(u) {
    if (!u?.id) return
    const next = !u.actif
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, actif: next } : x)))
    try {
      await apiFetch(`/api/utilisateurs/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: next }),
      })
      toast({ type: 'success', message: next ? 'Utilisateur activé.' : 'Utilisateur désactivé.' })
    } catch (e) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, actif: !next } : x)))
      toast({ type: 'error', message: e?.message || 'Erreur' })
    }
  }

  const csvData = useMemo(() => {
    return filteredUsers.map((u) => {
      const s = statsByUserId.get(String(u.id)) || { count: 0, total: 0 }
      return {
        nom: `${u.nom || ''} ${u.prenom || ''}`.trim(),
        email: u.email,
        role: u?.role?.nom || '',
        actif: u.actif ? 'oui' : 'non',
        commandes: s.count,
        total: s.total,
      }
    })
  }, [filteredUsers, statsByUserId])

  if (!hasAnyPermission(['utilisateurs.view', 'utilisateurs.manage'])) {
    return (
      <section className="content users">
        <div className="users-empty">Accès refusé.</div>
      </section>
    )
  }

  return (
    <section className="content users">
      <div className="users-head">
        <div>
          <div className="users-title">{pageTitle}</div>
          <div className="users-subtitle">{pageSub}</div>
        </div>
        <div className="users-head-actions">
          <button className="users-add" type="button" onClick={openCreate} disabled={submitting || !hasPermission('utilisateurs.manage')}>
            <UserPlus size={18} />
            Ajouter Utilisateur
          </button>
        </div>
      </div>

      <Alert type="error" message={error} />

      <div className="users-bar">
        {!fixedRole ? (
          <div className="users-tabs">
            <button className={roleFilter === 'agent' ? 'users-tab users-tab-active' : 'users-tab'} type="button" onClick={() => setRoleFilter('agent')}>
              Agents
            </button>
            <button className={roleFilter === 'livreur' ? 'users-tab users-tab-active' : 'users-tab'} type="button" onClick={() => setRoleFilter('livreur')}>
              Livreurs
            </button>
            <button className={roleFilter === 'all' ? 'users-tab users-tab-active' : 'users-tab'} type="button" onClick={() => setRoleFilter('all')}>
              Tous
            </button>
          </div>
        ) : null}

        <div className="users-tools">
          <div className="users-searchbox">
            <input
              className="users-search-input"
              placeholder="Rechercher des utilisateurs…"
              value={search}
              onChange={(e) => (setSearch ? setSearch(e.target.value) : null)}
            />
          </div>

          <div className="users-tool-btns">
            <div className="users-filter">
              <Filter size={16} />
              <select className="users-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tous</option>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </div>

            <CSVLink className="users-export" data={csvData} filename="utilisateurs.csv">
              <Download size={16} />
              Exporter
            </CSVLink>
          </div>
        </div>
      </div>

      <div className="users-table">
        {loading ? <div className="users-empty">Loading…</div> : null}
        {!loading && filteredUsers.length === 0 ? <div className="users-empty">Aucun utilisateur</div> : null}
        {!loading && filteredUsers.length ? (
          <div className="users-list">
            <div className="users-list-head">
              <div>Utilisateur</div>
              <div>Statut</div>
              <div>Commandes</div>
              <div>Total</div>
              <div>Actions</div>
            </div>

            {filteredUsers.map((u) => {
              const full = `${u.nom || ''} ${u.prenom || ''}`.trim() || '—'
              const initials = full
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((x) => x[0]?.toUpperCase())
                .join('')
              const s = statsByUserId.get(String(u.id)) || { count: 0, total: 0 }
              return (
                <div key={u.id} className="users-rowcard">
                  <div className="users-cell users-cell-user">
                    <div className="users-avatar">{initials || 'U'}</div>
                    <div className="users-meta">
                      <div className="users-name">{full}</div>
                      <div className="users-sub">
                        <span>{u.email}</span>
                        <span>•</span>
                        <span>{u?.role?.nom || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="users-cell">
                    <span className={u.actif ? 'users-badge users-badge-green' : 'users-badge users-badge-gray'}>
                      {u.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="users-cell users-metric">
                    <div className="users-metric-value">{s.count}</div>
                    <div className="users-metric-label">TOTAL</div>
                  </div>

                  <div className="users-cell users-metric">
                    <div className="users-metric-value users-metric-value-red">{s.total.toLocaleString('fr-FR')}</div>
                    <div className="users-metric-label">DH</div>
                  </div>

                  <div className="users-cell users-cell-actions">
                    <button
                      className={u.actif ? 'users-switch users-switch-on' : 'users-switch'}
                      type="button"
                      onClick={() => toggleActive(u)}
                      aria-label="Activer / Désactiver"
                      disabled={submitting || !hasPermission('utilisateurs.manage')}
                    >
                      <span className="users-switch-thumb" />
                    </button>
                    <button
                      className="users-icon"
                      type="button"
                      onClick={() => openEdit(u)}
                      aria-label="Modifier"
                      disabled={!hasPermission('utilisateurs.manage')}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      className="users-icon users-icon-danger"
                      type="button"
                      onClick={() => askDelete(u)}
                      aria-label="Supprimer"
                      disabled={!hasPermission('utilisateurs.manage')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      <UserModal
        open={open}
        mode={modalMode}
        roles={allowedRoles}
        initialValues={editing}
        onClose={() => {
          if (submitting) return
          setOpen(false)
          setEditing(null)
        }}
        onSubmit={submit}
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
