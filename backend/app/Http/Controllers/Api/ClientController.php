<?php

namespace App\Http\Controllers\Api;

use App\Models\Client;

class ClientController extends CrudController
{
    protected string $modelClass = Client::class;

    protected array $storeRules = [
        'nom' => ['required', 'string', 'max:150'],
        'telephone' => ['nullable', 'string', 'max:20'],
        'email' => ['nullable', 'email', 'max:100'],
        'adresse' => ['nullable', 'string'],
        'type_client' => ['nullable', 'in:detail,gros'],
        'actif' => ['nullable', 'boolean'],
    ];

    protected array $updateRules = [
        'nom' => ['sometimes', 'required', 'string', 'max:150'],
        'telephone' => ['nullable', 'string', 'max:20'],
        'email' => ['nullable', 'email', 'max:100'],
        'adresse' => ['nullable', 'string'],
        'type_client' => ['nullable', 'in:detail,gros'],
        'actif' => ['nullable', 'boolean'],
    ];
}

