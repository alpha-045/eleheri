import { Heart, Pencil, Trash2 } from 'lucide-react'

export default function ProductRow({ product, onEdit, onDelete }) {
  return (
    <div className="product-row">
      <div className="product-left">
        <div className="product-thumb">
          <img src={product.img} alt="" />
        </div>
        <div className="product-info">
          <div className="product-name">{product.nom}</div>
          <div className="product-meta">
            {product.categoryName ? `${product.categoryName} / ` : ''}
            {product.subCategoryName || product.categorie}
          </div>
        </div>
      </div>

      <div className="product-mid">
        <div className="product-price">{product.prix} MAD</div>
        <div className="product-stock">{product.stock} unités</div>
      </div>

      <div className="product-actions">
        <button className="icon-pill" type="button" aria-label="Favori">
          <Heart size={18} />
        </button>
        <button className="icon-pill" type="button" onClick={() => onEdit?.(product)} aria-label="Modifier">
          <Pencil size={18} />
        </button>
        <button className="icon-pill icon-pill-danger" type="button" onClick={() => onDelete?.(product)} aria-label="Supprimer">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
