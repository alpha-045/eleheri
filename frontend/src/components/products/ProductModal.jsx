import { useEffect, useMemo, useRef, useState, useCallback } from "react"; // Added useCallback just in case
import { ChevronDown, X } from "lucide-react";
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  DecodeHintType,
} from "@zxing/library";
import Alert from "../Alert";
import { toast } from "../../lib/toast";

export default function ProductModal({
  open,
  mode = "create",
  initialValues,
  sousCategories,
  onClose,
  onSubmit,
}) {
  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("");
  const [sousCategorieId, setSousCategorieId] = useState("");
  const [unite, setUnite] = useState("pièce");
  const [codeArticle, setCodeArticle] = useState("");
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const readerRef = useRef(null);

  // Video ID defined here so it's available everywhere
  const videoId = "product-scan-video";

  const canSubmit = useMemo(() => {
    const imageOk = mode === "edit" ? true : !!file;
    return (
      imageOk &&
      codeArticle.trim() &&
      nom.trim() &&
      prix !== "" &&
      stock !== "" &&
      sousCategorieId &&
      unite
    );
  }, [codeArticle, nom, prix, stock, sousCategorieId, unite, file, mode]);

  // --- MOVED ALL USEEFFECTS HERE ---

  useEffect(() => {
    if (!open) return;
    setNom(initialValues?.nom ?? "");
    setPrix(initialValues?.prix != null ? String(initialValues.prix) : "");
    setStock(
      initialValues?.seuil_min != null ? String(initialValues.seuil_min) : "",
    );
    setSousCategorieId(
      initialValues?.sous_categorie_id != null
        ? String(initialValues.sous_categorie_id)
        : "",
    );
    setUnite(initialValues?.unite ?? "pièce");
    setCodeArticle(initialValues?.code_article ?? "");
    setFile(null);
    setCameraError("");
    setScanning(false);
  }, [open, initialValues, mode]);

  function stopScanner() {
    try {
      readerRef.current?.reset?.();
    } catch (e) {
      void e;
    }
    readerRef.current = null;
    const video = document.getElementById(videoId);
    const stream = video?.srcObject;
    if (stream && typeof stream.getTracks === "function") {
      for (const t of stream.getTracks()) t.stop();
    }
    if (video) video.srcObject = null;
    setScanning(false);
  }

  useEffect(() => {
    if (open) return;
    try {
      readerRef.current?.reset?.();
    } catch (e) {
      void e;
    }
    readerRef.current = null;
    setScanning(false);
  }, [open]);

  // Wrap handleClose in useCallback to avoid dependency issues in the useEffect above
  const handleClose = useCallback(() => {
    stopScanner();
    onClose?.();
  }, [onClose]);
  // --- KEYDOWN USEEFFECT MOVED UP ---
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") handleClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]); // Added handleClose to deps for correctness, see note below

  // --- NOW WE CAN RETURN EARLY ---
  if (!open) return null;

  function startScanner() {
    setCameraError("");
    setScanning(true);
    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, 500);
      readerRef.current = reader;
      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const maybePromise = reader.decodeFromConstraints(
        constraints,
        videoId,
        (result, err) => {
          if (result) {
            const text = result.getText?.() ? result.getText() : String(result);
            const value = (text || "").toString().trim();
            if (!value) return;
            setCodeArticle(value);
            setCameraError("");
            toast({ type: "success", message: `Code scanné: ${value}` });
            reader.reset();
            setScanning(false);
            return;
          }

          if (
            err &&
            err.name &&
            err.name !== "NotFoundException" &&
            err.name !== "ChecksumException" &&
            err.name !== "FormatException"
          ) {
            setCameraError("Erreur scanner: " + err.name);
          }
        },
      );

      if (maybePromise?.catch) {
        maybePromise.catch(() => {
          setCameraError("Accès caméra refusé ou indisponible.");
          setScanning(false);
        });
      }
    } catch {
      setCameraError(
        "Impossible d'accéder à la caméra. Vérifie les permissions.",
      );
      setScanning(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    stopScanner();
    onSubmit?.({
      code_article: codeArticle.trim(),
      nom: nom.trim(),
      prix: Number(prix),
      seuil_min: Number(stock),
      sous_categorie_id: Number(sousCategorieId),
      unite,
      file,
    });
  }

  return (
    <div className="modal-overlay-product" onMouseDown={handleClose}>
      <div className="modal-product" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head-product">
          <div className="modal-title-product">
            {mode === "edit"
              ? "Modifier le produit"
              : "Ajouter un nouveau produit"}
          </div>
          <button
            className="modal-x-product"
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <form className="modal-body-product" onSubmit={submit}>
          <div className="product-scan">
            <div className="product-scan-video">
              <video
                id={videoId}
                className="product-scan-el"
                muted
                playsInline
                autoPlay
              />
              <div className="product-scan-line" />
            </div>
            <div className="product-scan-actions">
              <button
                className="btn-primary"
                type="button"
                onClick={() => (scanning ? stopScanner() : startScanner())}
              >
                {scanning ? "Arrêter" : "Démarrer"}
              </button>
              <div className="product-scan-hint">
                Place le code-barres dans le cadre.
              </div>
            </div>
            <Alert type="error" message={cameraError} />

            <label className="form-label">
              Code-barres / Code article
              <input
                className="form-input"
                value={codeArticle}
                onChange={(e) => setCodeArticle(e.target.value)}
                placeholder="Ex: 6130001234567"
                readOnly={mode !== "edit"}
                required
              />
              {mode !== "edit" ? (
                <div className="file-hint">
                  Scanne le code-barres pour remplir ce champ.
                </div>
              ) : null}
            </label>
          </div>
          <div className="right-part-product">
            <label className="form-label">
              Nom du produit
              <input
                className="form-input"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Tomates"
              />
            </label>

            <div className="form-grid">
              <label className="form-label">
                Prix (DH)
                <input
                  className="form-input form-input-muted"
                  inputMode="decimal"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  placeholder="30"
                />
              </label>
              <label className="form-label">
                Stock minimal
                <input
                  className="form-input form-input-muted"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="5"
                />
              </label>
            </div>

            <label className="form-label">
              Unité
              <div className="select-wrap">
                <select
                  className="form-select"
                  value={unite}
                  onChange={(e) => setUnite(e.target.value)}
                >
                  <option value="pièce">pièce</option>
                  <option value="kg">kg</option>
                  <option value="L">L</option>
                  <option value="m">m</option>
                </select>
                <ChevronDown className="select-ico" size={16} />
              </div>
            </label>

            <label className="form-label">
              Catégorie
              <div className="select-wrap">
                <select
                  className="form-select"
                  value={sousCategorieId}
                  onChange={(e) => setSousCategorieId(e.target.value)}
                >
                  <option value="" disabled>
                    Sélectionner
                  </option>
                  {sousCategories.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {(sc?.categorie?.nom ? `${sc.categorie.nom} / ` : "") +
                        sc.nom}
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-ico" size={16} />
              </div>
            </label>

            <div className="form-label">
              Image du produit
              <div className="file-row">
                <label className="file-btn">
                  Choisir un fichier
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required={mode !== "edit"}
                    style={{ display: "none" }}
                  />
                </label>
                <div className="file-name">
                  {file ? file.name : "Aucun fichier choisi"}
                </div>
              </div>
              {mode !== "edit" ? (
                <div className="file-hint">
                  Image obligatoire pour créer le produit.
                </div>
              ) : null}
            </div>
             <div className="modal-foot">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="btn-primary" type="submit" disabled={!canSubmit}>
              {mode === "edit" ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
}
