<?php

use App\Models\CommandeVente;

$commandes = CommandeVente::all();
foreach ($commandes as $c) {
    $c->numero = '#ORD-' . str_pad($c->id, 4, '0', STR_PAD_LEFT);
    $c->total = rand(100, 1000);
    $c->type_commande = rand(0, 1) ? 'livraison' : 'retrait';
    $c->save();
}

echo "Done.\n";
