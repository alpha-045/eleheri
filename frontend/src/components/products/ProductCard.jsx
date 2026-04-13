import { Pencil, Trash2 } from 'lucide-react'

export default function ProductCard({ product, onDelete }) {
  return (
    <div className="card">
      <div className="card-badge">
        {product.poids ? `${product.poids} ${product.unite}` : product.unite}
      </div>
      <div className="card-img">
        <img src={product.img} alt="" />
      </div>
      <div className="card-body">
        <div className="card-name">{product.nom}</div>
        <div className="card-cat">
          {product.categoryName ? `${product.categoryName} / ` : ''}
          {product.subCategoryName || product.categorie}
          {Number.isFinite(product.stock) ? ` • ${product.stock} u` : ''}
        </div>
        <div className="card-foot">
          <div className="card-price">
            {product.prix} DH/{product.unite}
          </div>
          <div className="card-actions">
            <button className="mini" type="button" aria-label="Edit">
              <Pencil size={16} color="#64748b" />
            </button>
            <button className="mini mini-danger" type="button" aria-label="Delete" onClick={() => onDelete?.(product)}>
              <Trash2 size={16} color="#ef4444" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
