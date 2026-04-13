<?php

namespace App\Http\Controllers\Api;

use App\Models\Category;

class CategoryController extends CrudController
{
    protected string $modelClass = Category::class;

    protected array $with = ['sousCategories'];

    protected array $storeRules = [
        'nom' => ['required', 'string', 'max:100'],
        'description' => ['nullable', 'string'],
    ];

    protected array $updateRules = [
        'nom' => ['sometimes', 'required', 'string', 'max:100'],
        'description' => ['nullable', 'string'],
    ];
}

