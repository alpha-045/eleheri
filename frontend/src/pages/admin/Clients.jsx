import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { CSVLink } from 'react-csv'
import '../../styles/clients.css'

export default function Clients() {
  const outlet = useOutletContext() || {}
  const search = (outlet.search || '').toString()
  const setSearch = typeof outlet.setSearch === 'function' ? outlet.setSearch : () => {}

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const [typeFilter, setTypeFilter] = useState('all')

  const [form, setForm] = useState({
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    type_client: 'detail',
    actif: true,
  })

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/clients?per_page=100')
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data || []
      setItems(list)
    } catch (e) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((c) => {
      const okType = typeFilter === 'all' ? true : (c?.type_client || '').toString() === typeFilter
      if (!okType) return false
      if (!q) return true
      const nom = (c?.nom || '').toString().toLowerCase()
      const tel = (c?.telephone || '').toString().toLowerCase()
      const email = (c?.email || '').toString().toLowerCase()
      return nom.includes(q) || tel.includes(q) || email.includes(q)
    })
  }, [items, search, typeFilter])

  function openAdd() {
    setEditing(null)
    setForm({ nom: '', telephone: '', email: '', adresse: '', type_client: 'detail', actif: true })
    setOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      nom: item?.nom || '',
      telephone: item?.telephone || '',
      email: item?.email || '',
      adresse: item?.adresse || '',
      type_client: (item?.type_client || 'detail').toString(),
      actif: Boolean(item?.actif ?? true),
    })
    setOpen(true)
  }

  function openDelete(item) {
    setDeleting(item)
    setConfirmOpen(true)
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        nom: form.nom,
        telephone: form.telephone || null,
        email: form.email || null,
        adresse: form.adresse || null,
        type_client: form.type_client,
        actif: Boolean(form.actif),
      }

      if (editing?.id) {
        await apiFetch(`/api/clients/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await apiFetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      setOpen(false)
      await loadAll()
    } catch (e2) {
      setError(e2?.message || 'Erreur')
    }
  }

  async function confirmDelete() {
    if (!deleting?.id) return
    setError('')
    try {
      await apiFetch(`/api/clients/${deleting.id}`, { method: 'DELETE' })
      setConfirmOpen(false)
      setDeleting(null)
      await loadAll()
    } catch (e) {
      setError(e?.message || 'Erreur')
    }
  }

  function typeLabel(t) {
    return t === 'gros' ? 'Gros' : 'Détail'
  }

  return (
    <section className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Clients</div>
          <div className="page-subtitle">Gestion des clients</div>
        </div>
        <button className="primary primary-pill" type="button" onClick={openAdd}>
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="tool-search">
            <Search size={16} color="#94a3b8" />
            <input
              className="tool-search-input"
              placeholder="Rechercher un client (nom, téléphone, email)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="tool-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">Tous les types</option>
            <option value="detail">Détail</option>
            <option value="gros">Gros</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-ghost" type="button">
             <CSVLink data={filtered} filename="clients.csv" style={{color:'red',textDecoration:'none'}}>
                          Exporter CSV
             </CSVLink>
          </button>
        </div>
      </div>

      {error ? <div className="banner banner-err">{error}</div> : null}

      <div className="orders-card">
        <div className="orders-card-head">
          <div className="orders-card-title">Liste des clients ({filtered.length})</div>
        </div>

        {loading ? (
          <div className="orders-empty">Loading…</div>
        ) : (
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Adresse</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td style={{fontWeight:'bolder'}}>{c.id}</td>
                    <td className="fw-500">{c.nom}</td>
                    <td>{c.telephone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>
                      <span className="type-badge">{typeLabel((c?.type_client || 'detail').toString())}</span>
                    </td>
                    <td>{c.adresse || '—'}</td>
                    <td>
                      <span className={c.actif ? 'status-badge status-livre' : 'status-badge status-annule'}>
                        {c.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <div className="orders-actions">
                        <button className="icon-pill" type="button" onClick={() => openEdit(c)} aria-label="Modifier">
                          <Pencil size={18} />
                        </button>
                        <button
                          className="icon-pill icon-pill-danger"
                          type="button"
                          onClick={() => openDelete(c)}
                          aria-label="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="orders-empty-cell">
                      Aucun client
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open ? (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{editing ? 'Modifier le client' : 'Ajouter un client'}</div>
              <button className="modal-x" type="button" onClick={() => setOpen(false)} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <form className="modal-body" onSubmit={submit}>
              <label className="form-label">
                Nom
                <input
                  className="form-input"
                  value={form.nom}
                  onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                  required
                />
              </label>

              <div className="form-grid">
                <label className="form-label">
                  Téléphone
                  <input
                    className="form-input"
                    value={form.telephone}
                    onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
                  />
                </label>

                <label className="form-label">
                  Email
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </label>
              </div>

              <div className="form-grid">
                <label className="form-label">
                  Type client
                  <select
                    className="form-select"
                    value={form.type_client}
                    onChange={(e) => setForm((p) => ({ ...p, type_client: e.target.value }))}
                  >
                    <option value="detail">Détail</option>
                    <option value="gros">Gros</option>
                  </select>
                </label>

                <label className="form-label">
                  Statut
                  <select
                    className="form-select"
                    value={form.actif ? '1' : '0'}
                    onChange={(e) => setForm((p) => ({ ...p, actif: e.target.value === '1' }))}
                  >
                    <option value="1">Actif</option>
                    <option value="0">Inactif</option>
                  </select>
                </label>
              </div>

              <label className="form-label">
                Adresse
                <input
                  className="form-input"
                  value={form.adresse}
                  onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))}
                />
              </label>

              <div className="modal-foot">
                <button className="btn-ghost" type="button" onClick={() => setOpen(false)}>
                  Annuler
                </button>
                <button className="btn-primary" type="submit">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmOpen && deleting ? (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Supprimer ?</div>
              <button className="modal-x" type="button" onClick={() => setConfirmOpen(false)} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="orders-confirm-text">
                Cette action est irréversible. Cela supprimera définitivement le client{' '}
                <span className="orders-confirm-strong">{deleting.nom}</span>.
              </div>
              <div className="modal-foot">
                <button className="btn-ghost" type="button" onClick={() => setConfirmOpen(false)}>
                  Annuler
                </button>
                <button className="btn-danger" type="button" onClick={confirmDelete}>
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
