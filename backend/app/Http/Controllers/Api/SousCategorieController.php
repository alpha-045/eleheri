<?php

namespace App\Http\Controllers\Api;

use App\Models\SousCategorie;

class SousCategorieController extends CrudController
{
    protected string $modelClass = SousCategorie::class;

    protected array $with = ['categorie'];

    protected array $storeRules = [
        'categorie_id' => ['required', 'integer', 'exists:categories,id'],
        'nom' => ['required', 'string', 'max:100'],
        'description' => ['nullable', 'string'],
    ];

    protected array $updateRules = [
        'categorie_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
        'nom' => ['sometimes', 'required', 'string', 'max:100'],
        'description' => ['nullable', 'string'],
    ];
}

