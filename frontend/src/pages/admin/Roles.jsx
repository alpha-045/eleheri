import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import Alert from '../../components/Alert'
import { toast } from '../../lib/toast'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/role.css'

const PERM_GROUPS = [
  {
    key: 'commandes',
    title: 'Commandes',
    perms: [
      { key: 'commandes.view', label: 'Voir les commandes' },
      { key: 'commandes.edit', label: 'Modifier les commandes' },
      { key: 'commandes.cancel', label: 'Annuler les commandes' },
    ],
  },
  {
    key: 'produits',
    title: 'Produits',
    perms: [
      { key: 'produits.view', label: 'Voir produits' },
      { key: 'produits.create', label: 'Ajouter produits' },
      { key: 'produits.edit', label: 'Modifier / Supprimer' },
    ],
  },
  {
    key: 'categories',
    title: 'Catégories',
    perms: [
      { key: 'categories.view', label: 'Voir catégories' },
      { key: 'categories.manage', label: 'Gérer la structure' },
    ],
  },
  {
    key: 'promotions',
    title: 'Promotions',
    perms: [
      { key: 'promotions.view', label: 'Voir promotions' },
      { key: 'promotions.manage', label: 'Créer / Modifier' },
    ],
  },
  {
    key: 'utilisateurs',
    title: 'Utilisateurs',
    perms: [
      { key: 'utilisateurs.view', label: 'Voir' },
      { key: 'utilisateurs.manage', label: 'Gérer' },
    ],
  },
  {
    key: 'systeme',
    title: 'Système',
    perms: [
      { key: 'systeme.stats', label: 'Statistiques : Voir' },
      { key: 'systeme.settings', label: 'Paramètres : Accès complet' },
    ],
  },
]

function uniq(list) {
  const set = new Set()
  for (const x of list || []) set.add(String(x))
  return Array.from(set)
}

function permissionLabel(perms, groupKey) {
  const group = PERM_GROUPS.find((g) => g.key === groupKey)
  if (!group) return { tone: 'none', label: '—' }
  const total = group.perms.length
  const count = group.perms.filter((p) => perms.has(p.key)).length
  if (count === 0) return { tone: 'none', label: '—' }
  if (count === total) return { tone: 'full', label: 'Complet' }
  return { tone: 'partial', label: 'Partiel' }
}

function RoleModal({ open, mode, initialValues, onClose, onSubmit }) {
  const [nom, setNom] = useState(() => initialValues?.nom ?? '')
  const [description, setDescription] = useState(() => initialValues?.description ?? '')
  const [selected, setSelected] = useState(() =>
    Array.isArray(initialValues?.permissions) ? initialValues.permissions : []
  )

  if (!open) return null

  const canSubmit = nom.trim().length > 0

  function toggle(key) {
    setSelected((prev) => {
      const set = new Set(prev.map(String))
      if (set.has(key)) set.delete(key)
      else set.add(key)
      return Array.from(set)
    })
  }

  function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({
      nom: nom.trim(),
      description: description.trim() ? description.trim() : null,
      permissions: uniq(selected),
    })
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal roles-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="roles-modal-title">{mode === 'edit' ? 'Modifier le rôle' : 'Créer un nouveau rôle'}</div>
            <div className="roles-modal-sub">CONFIGURATION DES ACCÈS UTILISATEUR</div>
          </div>
          <button className="modal-x" type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="roles-form-grid">
            <label className="form-label">
              NOM DU RÔLE
              <input className="form-input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Agent Livraison" />
            </label>
            <label className="form-label">
              DESCRIPTION
              <input
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez les responsabilités de ce rôle..."
              />
            </label>
          </div>

          <div className="roles-perms-title">PERMISSIONS</div>

          <div className="roles-perms-grid">
            {PERM_GROUPS.map((g) => (
              <div key={g.key} className="roles-perm-card">
                <div className="roles-perm-head">{g.title}</div>
                <div className="roles-perm-list">
                  {g.perms.map((p) => (
                    <label key={p.key} className="roles-check">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.key)}
                        onChange={() => toggle(p.key)}
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="modal-foot">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="btn-primary" type="submit" disabled={!canSubmit}>
              {mode === 'edit' ? 'Enregistrer' : 'Créer Rôle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Roles() {
  const { hasPermission } = useAuth()
  const [roles, setRoles] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editing, setEditing] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalSeed, setModalSeed] = useState(0)

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [rolesRes, usersRes] = await Promise.all([
        apiFetch('/api/roles?per_page=200'),
        apiFetch('/api/utilisateurs?per_page=200'),
      ])
      const r = Array.isArray(rolesRes?.data) ? rolesRes.data : rolesRes?.data?.data || []
      const u = Array.isArray(usersRes?.data) ? usersRes.data : usersRes?.data?.data || []
      setRoles(r)
      setUsers(u)
    } catch (e) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasPermission('systeme.settings')) return
    loadAll()
  }, [])

  const usersByRoleId = useMemo(() => {
    const map = new Map()
    for (const u of users) {
      const id = String(u?.role_id ?? u?.role?.id ?? '')
      if (!id) continue
      map.set(id, (map.get(id) || 0) + 1)
    }
    return map
  }, [users])

  const roleCards = useMemo(() => {
    return roles.map((r) => {
      const perms = new Set((Array.isArray(r?.permissions) ? r.permissions : []).map(String))
      const count = usersByRoleId.get(String(r.id)) || 0
      const isAdmin = (r?.nom || '').toString().toLowerCase() === 'admin' || (r?.nom || '').toString().toLowerCase().includes('admin')
      return {
        id: r.id,
        nom: r.nom,
        description: r.description,
        permissions: perms,
        rawPermissions: Array.isArray(r?.permissions) ? r.permissions : [],
        usersCount: count,
        badgeTone: isAdmin ? 'red' : 'blue',
      }
    })
  }, [roles, usersByRoleId])

  function openCreate() {
    setModalMode('create')
    setEditing(null)
    setModalSeed((s) => s + 1)
    setOpen(true)
  }

  function openEdit(r) {
    setModalMode('edit')
    setEditing(r)
    setModalSeed((s) => s + 1)
    setOpen(true)
  }

  function askDelete(r) {
    setDeleting(r)
    setConfirmOpen(true)
  }

  async function submit(values) {
    setSubmitting(true)
    setError('')
    try {
      if (modalMode === 'edit' && editing?.id) {
        await apiFetch(`/api/roles/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        toast({ type: 'success', message: 'Rôle mis à jour.' })
      } else {
        await apiFetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        toast({ type: 'success', message: 'Rôle créé.' })
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
      await apiFetch(`/api/roles/${deleting.id}`, { method: 'DELETE' })
      toast({ type: 'success', message: 'Rôle supprimé.' })
      setConfirmOpen(false)
      setDeleting(null)
      await loadAll()
    } catch (e) {
      toast({ type: 'error', message: e?.message || 'Impossible de supprimer le rôle.' })
      setError(e?.message || 'Erreur')
    } finally {
      setSubmitting(false)
    }
  }

  const matrixResources = useMemo(() => {
    return [
      { key: 'commandes', label: 'Commandes' },
      { key: 'produits', label: 'Produits' },
      { key: 'categories', label: 'Catégories' },
      { key: 'promotions', label: 'Promotions' },
      { key: 'utilisateurs', label: 'Utilisateurs' },
      { key: 'systeme', label: 'Système' },
    ]
  }, [])

  if (!hasPermission('systeme.settings')) {
    return (
      <section className="content roles">
        <div className="roles-empty">Accès refusé.</div>
      </section>
    )
  }

  return (
    <section className="content roles">
      <div className="page-head roles-head">
        <div>
          <div className="page-title">Rôles &amp; Permissions</div>
          <div className="page-subtitle">Gérer les rôles et leurs permissions</div>
        </div>
        <button className="primary primary-pill" type="button" onClick={openCreate}>
          <Plus size={16} />
          Créer Rôle
        </button>
      </div>

      <Alert type="error" message={error} />

      <div className="roles-layout">
        <div className="roles-main">
          <div className="roles-grid">
            {loading ? <div className="roles-empty">Loading…</div> : null}
            {!loading && roleCards.length === 0 ? <div className="roles-empty">Aucun rôle</div> : null}
            {!loading
              ? roleCards.map((r) => (
                  <div key={r.id} className="roles-card">
                    <div className="roles-card-top">
                      <div>
                        <div className="roles-card-title">
                          {r.nom}
                          <span className={r.badgeTone === 'red' ? 'roles-pill roles-pill-red' : 'roles-pill roles-pill-blue'}>
                            {r.usersCount}
                          </span>
                        </div>
                        <div className="roles-card-sub">{r.description || '—'}</div>
                      </div>

                      <div className="roles-actions">
                        <button className="icon-pill" type="button" onClick={() => openEdit(r)} aria-label="Modifier">
                          <Pencil size={18} />
                        </button>
                        <button className="icon-pill icon-pill-danger" type="button" onClick={() => askDelete(r)} aria-label="Supprimer">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="roles-card-block">
                      <div className="roles-block-title">Permissions:</div>
                      <div className="roles-chip-row">
                        {PERM_GROUPS.map((g) => {
                          const p = permissionLabel(r.permissions, g.key)
                          if (p.tone === 'none') return null
                          const cls =
                            p.tone === 'full' ? 'roles-chip roles-chip-full' : p.tone === 'partial' ? 'roles-chip roles-chip-partial' : 'roles-chip'
                          return (
                            <div key={g.key} className={cls}>
                              {g.title}: {p.label}
                            </div>
                          )
                        })}
                        {Array.from(r.permissions).length === 0 ? <div className="roles-chip roles-chip-none">Aucune permission</div> : null}
                      </div>
                    </div>
                  </div>
                ))
              : null}
          </div>

          {/* الإضافة هنا: البلوك كيطحو تحت الكروت كمقطع أفقي */}
          <aside className="roles-side">
            <div className="roles-mini">
              <div className="roles-mini-ico">🛡️</div>
              <div className="roles-mini-meta">
                <div className="roles-mini-label">TOTAL RÔLES</div>
                <div className="roles-mini-value">{String(roleCards.length).padStart(2, '0')}</div>
              </div>
            </div>

            <div className="roles-help">
              <div className="roles-help-title">Aide Mémoire</div>
              <div className="roles-help-list">
                <div className="roles-help-item">
                  <span className="roles-dot roles-dot-green" />
                  <div>
                    <div className="roles-help-strong">Complet:</div>
                    <div className="roles-help-text">Accès total et lecture / écriture / suppression.</div>
                  </div>
                </div>
                <div className="roles-help-item">
                  <span className="roles-dot roles-dot-blue" />
                  <div>
                    <div className="roles-help-strong">Partiel:</div>
                    <div className="roles-help-text">Lecture et modification autorisées, suppression interdite.</div>
                  </div>
                </div>
                <div className="roles-help-item">
                  <span className="roles-dot roles-dot-gray" />
                  <div>
                    <div className="roles-help-strong">Droit:</div>
                    <div className="roles-help-text">Aucun accès au module sélectionné.</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="roles-matrix">
            <div className="roles-matrix-head">
              <div className="roles-matrix-title">Ressource</div>
              <div
                className="roles-matrix-cols"
                style={{ gridTemplateColumns: `repeat(${Math.max(1, roleCards.length)}, minmax(0, 1fr))` }}
              >
                {roleCards.map((r) => (
                  <div key={r.id} className="roles-matrix-col">
                    {r.nom}
                  </div>
                ))}
              </div>
            </div>

            <div className="roles-matrix-body">
              {matrixResources.map((res) => (
                <div key={res.key} className="roles-matrix-row">
                  <div className="roles-matrix-res">{res.label}</div>
                  <div
                    className="roles-matrix-cells"
                    style={{ gridTemplateColumns: `repeat(${Math.max(1, roleCards.length)}, minmax(0, 1fr))` }}
                  >
                    {roleCards.map((r) => {
                      const p = permissionLabel(r.permissions, res.key)
                      const cls =
                        p.tone === 'full'
                          ? 'roles-badge roles-badge-full'
                          : p.tone === 'partial'
                            ? 'roles-badge roles-badge-partial'
                            : 'roles-badge roles-badge-none'
                      return (
                        <div key={`${res.key}-${r.id}`} className={cls}>
                          {p.label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <RoleModal
        key={modalSeed}
        open={open}
        mode={modalMode}
        initialValues={modalMode === 'edit' ? editing : null}
        onClose={() => {
          if (submitting) return
          setOpen(false)
          setEditing(null)
        }}
        onSubmit={submit}
      />

      {confirmOpen ? (
        <div className="modal-overlay" onMouseDown={() => setConfirmOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Supprimer le rôle</div>
              <button className="modal-x" type="button" onClick={() => setConfirmOpen(false)} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-label">{`Voulez-vous supprimer "${deleting?.nom || ''}" ?`}</div>
              <div className="modal-foot">
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false)
                    setDeleting(null)
                  }}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button className="btn-danger" type="button" onClick={confirmDelete} disabled={submitting}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
