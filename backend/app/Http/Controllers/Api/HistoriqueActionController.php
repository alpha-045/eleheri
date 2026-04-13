<?php

namespace App\Http\Controllers\Api;

use App\Models\HistoriqueAction;

class HistoriqueActionController extends CrudController
{
    protected string $modelClass = HistoriqueAction::class;

    protected array $with = ['utilisateur'];

    protected array $storeRules = [
        'utilisateur_id' => ['nullable', 'integer', 'exists:utilisateurs,id'],
        'action' => ['required', 'string', 'max:100'],
        'table_cible' => ['nullable', 'string', 'max:100'],
        'enregistrement_id' => ['nullable', 'integer'],
        'details' => ['nullable', 'array'],
    ];

    protected array $updateRules = [
        'utilisateur_id' => ['nullable', 'integer', 'exists:utilisateurs,id'],
        'action' => ['sometimes', 'required', 'string', 'max:100'],
        'table_cible' => ['nullable', 'string', 'max:100'],
        'enregistrement_id' => ['nullable', 'integer'],
        'details' => ['nullable', 'array'],
    ];
}

