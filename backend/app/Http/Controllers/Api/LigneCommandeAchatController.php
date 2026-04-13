<?php

namespace App\Http\Controllers\Api;

use App\Models\LigneCommandeAchat;

class LigneCommandeAchatController extends CrudController
{
    protected string $modelClass = LigneCommandeAchat::class;

    protected array $with = ['commande', 'article'];

    protected array $storeRules = [
        'commande_achat_id' => ['required', 'integer', 'exists:commandes_achat,id'],
        'article_id' => ['required', 'integer', 'exists:articles,id'],
        'quantite' => ['required', 'numeric', 'gt:0'],
        'quantite_recue' => ['nullable', 'numeric', 'min:0'],
        'prix_unitaire' => ['required', 'numeric', 'min:0'],
    ];

    protected array $updateRules = [
        'quantite' => ['sometimes', 'required', 'numeric', 'gt:0'],
        'quantite_recue' => ['nullable', 'numeric', 'min:0'],
        'prix_unitaire' => ['sometimes', 'required', 'numeric', 'min:0'],
    ];
}

