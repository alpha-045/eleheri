import React, { useState, useEffect } from 'react';
import { Filter, Eye, Edit, Trash2, X } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { apiFetch } from '../../lib/api'
import '../../styles/commandes.css'
import { CSVLink } from 'react-csv'
import { toast } from '../../components/Alert'



const Commandes = () => {
  const outlet = useOutletContext() || {};
  const searchQuery = (outlet.searchQuery || '').toString();
  const [commandes, setCommandes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [selectedCommande, setSelectedCommande] = useState(null);
  
  // Edit Form State
  const [editForm, setEditForm] = useState({
    client_id: '',
    type_commande: 'livraison',
    statut: '',
    total: ''
  });

  useEffect(() => {
    fetchCommandes();
    fetchClients();
  }, []);

  const fetchCommandes = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/commandes_vente');
      // Assume API returns array directly or { data: [] }
      setCommandes(data.data || data);
    } catch (error) {
      toast({ type: 'error', message: error?.message || 'Erreur de chargement des commandes.' })
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await apiFetch('/api/clients');
      setClients(data.data || data);
    } catch (error) {
      toast({ type: 'error', message: error?.message || 'Erreur de chargement des clients.' })
    }
  };

  // Handlers for Modals
  const handleView = (cmd) => {
    setSelectedCommande(cmd);
    setViewModalOpen(true);
  };

  const handleEdit = (cmd) => {
    setSelectedCommande(cmd);
    const rawStatut = (cmd?.statut || '').toString();
    const s = rawStatut.toLowerCase();
    const statut =
      s.includes('pay') || s.includes('livr') ? 'payée' : s.includes('confirm') ? 'confirmée' : s.includes('annul') ? 'annulée' : 'en_attente';
    setEditForm({
      client_id: cmd.client_id || '',
      type_commande: (cmd?.type_commande || 'livraison').toString().toLowerCase() === 'retrait' ? 'retrait' : 'livraison',
      statut,
      total: cmd.total || 0
    });
    setEditModalOpen(true);
  };

  const handleDelete = (cmd) => {
    setSelectedCommande(cmd);
    setDeleteModalOpen(true);
  };

  // API Actions
  const submitEdit = async () => {
    try {
      await apiFetch(`/api/commandes_vente/${selectedCommande.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: editForm.client_id === '' ? null : Number(editForm.client_id),
          type_commande: (editForm.type_commande || 'livraison').toString().toLowerCase() === 'retrait' ? 'retrait' : 'livraison',
          statut: (editForm.statut || '').toString(),
          total: editForm.total === '' ? 0 : Number(editForm.total),
        })
      });
      setEditModalOpen(false);
      fetchCommandes();
      toast({ type: 'success', message: 'Commande mise à jour.' })
    } catch (error) {
      toast({ type: 'error', message: error?.message || 'Impossible de modifier la commande.' })
    }
  };

  const confirmDelete = async () => {
    try {
      await apiFetch(`/api/commandes_vente/${selectedCommande.id}`, {
        method: 'DELETE'
      });
      setDeleteModalOpen(false);
      fetchCommandes();
      toast({ type: 'success', message: 'Commande supprimée.' })
    } catch (error) {
      toast({ type: 'error', message: error?.message || 'Impossible de supprimer la commande.' })
    }
  };

  // Formatting helpers
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const getStatusBadge = (status) => {
    let className = 'status-badge ';
    let label = status;
    
    // Normalize status strings for matching
    const s = (status || '').toLowerCase();
    
    if (s.includes('cours') || s.includes('attente')) {
      className += 'status-en-cours';
      label = 'En cours';
    } else if (s.includes('livr') || s.includes('pay')) {
      className += 'status-livre';
      label = 'Livré';
    } else if (s.includes('annul')) {
      className += 'status-annule';
      label = 'Annulé';
    } else {
      className += 'status-default';
    }
    
    return <span className={className}>{label}</span>;
  };

  const getTypeBadge = (type) => {
    const t = (type || 'livraison').toLowerCase();
    const label = t === 'retrait' ? 'Retrait' : 'Livraison';
    return <span className="type-badge">{label}</span>;
  };

  // Filtered data
  const filteredCommandes = commandes.filter(cmd => {
    const q = searchQuery.trim().toLowerCase();
    const numero = (cmd?.numero || '').toString().toLowerCase();
    const clientNom = (cmd?.client?.nom || '').toString().toLowerCase();

    const matchesSearch = q === '' || numero.includes(q) || clientNom.includes(q);
      
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'en_cours' && (cmd.statut === 'en_attente' || cmd.statut === 'En cours')) ||
      (statusFilter === 'livre' && (cmd.statut === 'payée' || cmd.statut === 'Livré')) ||
      (statusFilter === 'annule' && (cmd.statut === 'annulée' || cmd.statut === 'Annulé'));
      
    const matchesType =
      typeFilter === '' ||
      ((cmd?.type_commande || '').toString().toLowerCase() === typeFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <section className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Commandes</div>
          <div className="page-subtitle">Gérer toutes les commandes (MAD)</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <button className="icon-pill" type="button" aria-label="Filtres">
            <Filter size={18} />
          </button>
          
          <select 
            className="tool-select" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="livre">Livré</option>
            <option value="annule">Annulé</option>
          </select>
          
          <select 
            className="tool-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Tous les types</option>
            <option value="livraison">Livraison</option>
            <option value="retrait">Retrait</option>
          </select>
        </div>
        
        <div className="toolbar-right">
          <button className="btn-ghost" type="button">

               <CSVLink data={filteredCommandes} filename="Commandes.csv" style={{color:'red',textDecoration:'none'}}>
                          Exporter CSV
             </CSVLink>
          </button>
        </div>
      </div>

      <div className="orders-card">
        <div className="orders-card-head">
          <div className="orders-card-title">Liste des commandes ({filteredCommandes.length})</div>
        </div>
        
        {loading ? (
          <div className="orders-empty">Loading…</div>
        ) : (
          <div className="orders-table-wrap">
            <table className="orders-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCommandes.map(cmd => (
                <tr key={cmd.id}>
                  <td className="fw-500">{cmd.numero || `#ORD-${cmd.id}`}</td>
                  <td>{cmd.client ? cmd.client.nom : 'Client inconnu'}</td>
                  <td>{getTypeBadge(cmd.type_commande)}</td>
                  <td>{getStatusBadge(cmd.statut)}</td>
                  <td>{cmd.total} DH</td>
                  <td>{formatDate(cmd.date_commande || cmd.created_at)}</td>
                  <td>
                    <div className="orders-actions">
                      <button className="icon-pill" type="button" onClick={() => handleView(cmd)} aria-label="Voir">
                        <Eye size={18} />
                      </button>
                      <button className="icon-pill" type="button" onClick={() => handleEdit(cmd)} aria-label="Modifier">
                        <Edit size={18} />
                      </button>
                      <button className="icon-pill icon-pill-danger" type="button" onClick={() => handleDelete(cmd)} aria-label="Supprimer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCommandes.length === 0 && (
                <tr>
                  <td colSpan="7" className="orders-empty-cell">Aucune commande trouvée</td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModalOpen && selectedCommande && (
        <div className="modal-overlay">
          <div className="modal modal-red">
            <div className="modal-head">
              <div className="modal-title">Détails de la commande {selectedCommande.numero || `#ORD-${selectedCommande.id}`}</div>
              <button className="modal-x modal-x-invert" type="button" onClick={() => setViewModalOpen(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body modal-body-red">
              <div>
                <div className="detail-label">Client</div>
                <div className="detail-value detail-strong">{selectedCommande.client ? selectedCommande.client.nom : 'Client inconnu'}</div>
              </div>
              
              <div>
                <div className="detail-label">Articles</div>
                <div className="detail-list">
                  {selectedCommande.lignes && selectedCommande.lignes.length > 0 ? (
                    selectedCommande.lignes.map((ligne, idx) => (
                      <div key={idx} className="detail-list-item">
                        {ligne.article ? ligne.article.nom : 'Article'} ({ligne.quantite} {ligne.article ? ligne.article.unite : ''})
                      </div>
                    ))
                  ) : (
                    <div className="detail-list-item">Aucun article enregistré.</div>
                  )}
                </div>
              </div>
              
              <div className="detail-total">
                <span>Total</span>
                <span className="detail-strong">{selectedCommande.total} MAD</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedCommande && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">Modifier la commande {selectedCommande.numero || `#ORD-${selectedCommande.id}`}</div>
              <button className="modal-x" type="button" onClick={() => setEditModalOpen(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <label className="form-label">
                Client
                <select 
                  className="form-select"
                  value={editForm.client_id}
                  onChange={(e) => setEditForm({...editForm, client_id: e.target.value})}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                Type
                <select
                  className="form-select"
                  value={editForm.type_commande}
                  onChange={(e) => setEditForm({ ...editForm, type_commande: e.target.value })}
                >
                  <option value="livraison">Livraison</option>
                  <option value="retrait">Retrait</option>
                </select>
              </label>
              
              <label className="form-label">
                Statut
                <select 
                  className="form-select"
                  value={editForm.statut}
                  onChange={(e) => setEditForm({...editForm, statut: e.target.value})}
                >
                  <option value="en_attente">En cours</option>
                  <option value="confirmée">Confirmée</option>
                  <option value="payée">Payée</option>
                  <option value="annulée">Annulée</option>
                </select>
              </label>
              
              <label className="form-label">
                Total (MAD)
                <input 
                  type="number" 
                  className="form-input" 
                  value={editForm.total}
                  onChange={(e) => setEditForm({...editForm, total: e.target.value})}
                />
              </label>
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" type="button" onClick={() => setEditModalOpen(false)}>Annuler</button>
              <button className="btn-primary" type="button" onClick={submitEdit}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedCommande && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">Êtes-vous sûr ?</div>
              <button className="modal-x" type="button" onClick={() => setDeleteModalOpen(false)} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="orders-confirm-text">
                Cette action est irréversible. Cela supprimera définitivement la commande{' '}
                <span className="orders-confirm-strong">{selectedCommande.numero || `#ORD-${selectedCommande.id}`}</span>.
              </div>
              <div className="modal-foot">
                <button className="btn-ghost" type="button" onClick={() => setDeleteModalOpen(false)}>Annuler</button>
                <button className="btn-danger" type="button" onClick={confirmDelete}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Commandes;
