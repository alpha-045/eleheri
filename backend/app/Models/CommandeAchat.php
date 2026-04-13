<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommandeAchat extends Model
{
    protected $table = 'commandes_achat';

    protected $fillable = [
        'fournisseur_id',
        'statut',
        'date_commande',
        'date_reception',
        'note',
        'utilisateur_id',
    ];

    protected $casts = [
        'date_commande' => 'date',
        'date_reception' => 'date',
    ];

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class, 'fournisseur_id');
    }

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(LigneCommandeAchat::class, 'commande_achat_id');
    }
}

