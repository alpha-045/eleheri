<?php

namespace App\Http\Controllers\Api;

use App\Models\Article;

class ArticleController extends CrudController
{
    protected string $modelClass = Article::class;

    protected array $with = ['sousCategorie', 'prix', 'stock'];

    protected array $storeRules = [
        'sous_categorie_id' => ['required', 'integer', 'exists:sous_categories,id'],
        'code_article' => ['required', 'string', 'max:50', 'unique:articles,code_article'],
        'nom' => ['required', 'string', 'max:150'],
        'description' => ['nullable', 'string'],
        'unite' => ['nullable', 'string', 'max:20'],
        'image' => ['nullable', 'string', 'max:255'],
        'actif' => ['nullable', 'boolean'],
    ];

    protected array $updateRules = [
        'sous_categorie_id' => ['sometimes', 'required', 'integer', 'exists:sous_categories,id'],
        'code_article' => ['sometimes', 'required', 'string', 'max:50'],
        'nom' => ['sometimes', 'required', 'string', 'max:150'],
        'description' => ['nullable', 'string'],
        'unite' => ['nullable', 'string', 'max:20'],
        'image' => ['nullable', 'string', 'max:255'],
        'actif' => ['nullable', 'boolean'],
    ];
}

