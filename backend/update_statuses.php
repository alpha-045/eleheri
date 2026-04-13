<?php

use App\Models\CommandeVente;

$commandes = CommandeVente::all();
foreach ($commandes as $c) {
    if ($c->statut == 'en_attente') $c->statut = 'En cours';
    elseif ($c->statut == 'confirmée') $c->statut = 'En cours';
    elseif ($c->statut == 'payée') $c->statut = 'Livré';
    elseif ($c->statut == 'annulée') $c->statut = 'Annulé';
    else $c->statut = 'En cours';
    
    $c->save();
}

echo "Status updated.\n";
