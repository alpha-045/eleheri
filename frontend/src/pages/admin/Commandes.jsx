import React from "react";
import { useOutletContext } from "react-router-dom";
import "../../styles/commandes.css";
import { PageHead } from "../../components/Commandes/page-head";
import { Toolbar } from "../../components/Commandes/Toolbar";
import { ViewCommandes } from "../../components/Commandes/view";
import { ViewModal } from "../../components/Commandes/ViewModal";
import { EditModal } from "../../components/Commandes/EditModal";
import { DeleteModal } from "../../components/Commandes/DeleteModal";
import { useCommandesPage } from "../../features/commandes/useCommandesPage";

const Commandes = () => {
  const outlet = useOutletContext() || {};
  const searchQuery = (outlet.searchQuery || "").toString();
  const {
    loading,
    clients,
    filteredCommandes,
    statusFilter,
    setStatusFilter,
    setTypeFilter,
    viewModalOpen,
    editModalOpen,
    deleteModalOpen,
    selectedCommande,
    setViewModalOpen,
    setEditModalOpen,
    setDeleteModalOpen,
    editForm,
    setEditForm,
    submitEdit,
    confirmDelete,
    formatDate,
    getStatusBadge,
    getTypeBadge,
    handleView,
    handleEdit,
    handleDelete,
  } = useCommandesPage(searchQuery);

  return (
    <section className="content">
      <PageHead title="Commandes" subtitle="Gérer toutes les commandes (MAD)" />
      <Toolbar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        setTypeFilter={setTypeFilter}
        status={[ "En cours", "Livré", "Annulé"]}
        types={["livraison", "retrait"]}
        filteredexpot={filteredCommandes}
        filename={"Commandes"}
      />
      <div className="orders-card">
        <div className="orders-card-head">
          <div className="orders-card-title">
            Liste des commandes ({filteredCommandes.length})
          </div>
        </div>

        {loading ? (
          <div className="orders-empty">Loading…</div>
        ) : (
          <ViewCommandes
            filteredCommandes={filteredCommandes}
            getTypeBadge={getTypeBadge}
            getStatusBadge={getStatusBadge}
            formatDate={formatDate}
            handleView={handleView}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        )}
      </div>

      {/* View Modal */}
      {viewModalOpen && selectedCommande && (
        <ViewModal setViewModalOpen={setViewModalOpen} selectedCommande={selectedCommande} />
      )}

      {/* Edit Modal */}
      {editModalOpen && selectedCommande && (
        <EditModal
          selectedCommande={selectedCommande}
          setEditModalOpen={setEditModalOpen}
          editForm={editForm}
          clients={clients}
          setEditForm={setEditForm}
          submitEdit={submitEdit}
        />
      )}

      {/* Delete Modal */}
      {deleteModalOpen && selectedCommande && (
        <DeleteModal
          setDeleteModalOpen={setDeleteModalOpen}
          confirmDelete={confirmDelete}
          selectedCommande={selectedCommande}
        />
      )}
    </section>
  );
};

export default Commandes;
