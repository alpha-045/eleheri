import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { CSVLink } from "react-csv";

import { apiFetch } from "../../lib/api";
import Alert from "../../components/Alert";
import "../../styles/fournisseurs.css";

export default function Fournisseurs() {
  const outlet = useOutletContext() || {};
  const search = (outlet.search || "").toString();
  const setSearch =
    typeof outlet.setSearch === "function" ? outlet.setSearch : () => {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    email: "",
    adresse: "",
    actif: true,
  });

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/fournisseurs?per_page=100");
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setItems(list);
    } catch (e) {
      setError(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((f) => {
      const nom = (f?.nom || "").toString().toLowerCase();
      const tel = (f?.telephone || "").toString().toLowerCase();
      const email = (f?.email || "").toString().toLowerCase();
      return nom.includes(q) || tel.includes(q) || email.includes(q);
    });
  }, [items, search]);

  function openAdd() {
    setEditing(null);
    setForm({ nom: "", telephone: "", email: "", adresse: "", actif: true });
    setOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      nom: item?.nom || "",
      telephone: item?.telephone || "",
      email: item?.email || "",
      adresse: item?.adresse || "",
      actif: Boolean(item?.actif ?? true),
    });
    setOpen(true);
  }

  function openDelete(item) {
    setDeleting(item);
    setConfirmOpen(true);
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        nom: form.nom,
        telephone: form.telephone || null,
        email: form.email || null,
        adresse: form.adresse || null,
        actif: Boolean(form.actif),
      };

      if (editing?.id) {
        await apiFetch(`/api/fournisseurs/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/fournisseurs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setOpen(false);
      await loadAll();
    } catch (e2) {
      setError(e2?.message || "Erreur");
    }
  }

  async function confirmDelete() {
    if (!deleting?.id) return;
    setError("");
    try {
      await apiFetch(`/api/fournisseurs/${deleting.id}`, { method: "DELETE" });
      setConfirmOpen(false);
      setDeleting(null);
      await loadAll();
    } catch (e) {
      setError(e?.message || "Erreur");
    }
  }

  return (
    <section className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Fournisseurs</div>
          <div className="page-subtitle">Gestion des fournisseurs</div>
        </div>
        <button
          className="primary primary-pill"
          type="button"
          onClick={openAdd}
        >
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
              placeholder="Rechercher un fournisseur (nom, téléphone, email)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn-ghost" type="button">
            <CSVLink data={filtered} filename="fournisseurs.csv" style={{color:'red',textDecoration:'none'}}>
              Exporter CSV
            </CSVLink>
          </button>
        </div>
      </div>

      <Alert type="error" message={error} />

      <div className="orders-card">
        <div className="orders-card-head">
          <div className="orders-card-title">
            Liste des fournisseurs ({filtered.length})
          </div>
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
                  <th>Adresse</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id}>
                    <td style={{fontWeight:'bolder'}}>{f.id}</td>
                    <td className="fw-500">{f.nom}</td>
                    <td>{f.telephone || "—"}</td>
                    <td>{f.email || "—"}</td>
                    <td>{f.adresse || "—"}</td>
                    <td>
                      <span
                        className={
                          f.actif
                            ? "status-badge status-livre"
                            : "status-badge status-annule"
                        }
                      >
                        {f.actif ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td>
                      <div className="orders-actions">
                        <button
                          className="icon-pill"
                          type="button"
                          onClick={() => openEdit(f)}
                          aria-label="Modifier"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          className="icon-pill icon-pill-danger"
                          type="button"
                          onClick={() => openDelete(f)}
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
                    <td colSpan="6" className="orders-empty-cell">
                      Aucun fournisseur
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
              <div className="modal-title">
                {editing ? "Modifier le fournisseur" : "Ajouter un fournisseur"}
              </div>
              <button
                className="modal-x"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <form className="modal-body" onSubmit={submit}>
              <label className="form-label">
                Nom
                <input
                  className="form-input"
                  value={form.nom}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nom: e.target.value }))
                  }
                  required
                />
              </label>

              <div className="form-grid">
                <label className="form-label">
                  Téléphone
                  <input
                    className="form-input"
                    value={form.telephone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, telephone: e.target.value }))
                    }
                  />
                </label>

                <label className="form-label">
                  Email
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, email: e.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="form-label">
                Adresse
                <input
                  className="form-input"
                  value={form.adresse}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, adresse: e.target.value }))
                  }
                />
              </label>

              <label className="form-label">
                Statut
                <select
                  className="form-select"
                  value={form.actif ? "1" : "0"}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, actif: e.target.value === "1" }))
                  }
                >
                  <option value="1">Actif</option>
                  <option value="0">Inactif</option>
                </select>
              </label>

              <div className="modal-foot">
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => setOpen(false)}
                >
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
              <button
                className="modal-x"
                type="button"
                onClick={() => setConfirmOpen(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="orders-confirm-text">
                Cette action est irréversible. Cela supprimera définitivement le
                fournisseur{" "}
                <span className="orders-confirm-strong">{deleting.nom}</span>.
              </div>
              <div className="modal-foot">
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => setConfirmOpen(false)}
                >
                  Annuler
                </button>
                <button
                  className="btn-danger"
                  type="button"
                  onClick={confirmDelete}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
