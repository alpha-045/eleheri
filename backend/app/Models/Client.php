<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $table = 'clients';

    protected $fillable = [
        'nom',
        'telephone',
        'email',
        'adresse',
        'type_client',
        'actif',
    ];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function commandesVente(): HasMany
    {
        return $this->hasMany(CommandeVente::class, 'client_id');
    }
}

