import { Plus, Search } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { CSVLink } from 'react-csv'
import Alert from '../../components/Alert'
import '../../styles/clients.css'
import { useClientsPage } from '../../features/clients/useClientsPage'
import { ClientModal } from '../../components/Clients/ClientModal'
import { ViewClients } from '../../components/Clients/ViewClients'
import { ConfirmModal } from '../../components/ConfirmModal'

export default function Clients() {
  const outlet = useOutletContext() || {}
  const search = (outlet.search || '').toString()
  const setSearch = typeof outlet.setSearch === 'function' ? outlet.setSearch : () => {}

  const {
    loading,
    error,
    open,
    setOpen,
    confirmOpen,
    setConfirmOpen,
    editing,
    deleting,
    setDeleting,
    submitting,
    typeFilter,
    setTypeFilter,
    filtered,
    openAdd,
    openEdit,
    openDelete,
    submit,
    confirmDelete
  } = useClientsPage(search)

  return (
    <section className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Clients</div>
          <div className="page-subtitle">Gestion des clients</div>
        </div>
        <button className="primary primary-pill" type="button" onClick={openAdd} disabled={loading}>
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

      <Alert type="error" message={error} />

      <div className="orders-card">
        <div className="orders-card-head">
          <div className="orders-card-title">Liste des clients ({filtered.length})</div>
        </div>

        {loading ? (
          <div className="orders-empty">Loading…</div>
        ) : (
          <ViewClients filtered={filtered} openEdit={openEdit} openDelete={openDelete} />
        )}
      </div>

      <ClientModal
        open={open}
        editing={editing}
        onClose={() => setOpen(false)}
        onSubmit={submit}
        submitting={submitting}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Supprimer ?"
        description={`Cette action est irréversible. Cela supprimera définitivement le client "${deleting?.nom || ''}".`}
        onClose={() => {
          setConfirmOpen(false)
          setDeleting(null)
        }}
        onConfirm={confirmDelete}
        confirmLabel="Supprimer"
        disabled={submitting}
      />
    </section>
  )
}

