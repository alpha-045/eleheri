<?php

namespace App\Http\Controllers\Api;

use App\Models\CommandeAchat;
use App\Models\MouvementStock;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommandeAchatController extends CrudController
{
    protected string $modelClass = CommandeAchat::class;

    protected array $with = ['fournisseur', 'utilisateur', 'lignes.article'];

    protected array $storeRules = [
        'fournisseur_id' => ['nullable', 'integer', 'exists:fournisseurs,id'],
        'statut' => ['nullable', 'in:brouillon,confirmée,reçue,annulée'],
        'date_commande' => ['required', 'date'],
        'date_reception' => ['nullable', 'date'],
        'note' => ['nullable', 'string'],
        'utilisateur_id' => ['nullable', 'integer', 'exists:utilisateurs,id'],
    ];

    protected array $updateRules = [
        'fournisseur_id' => ['nullable', 'integer', 'exists:fournisseurs,id'],
        'statut' => ['nullable', 'in:brouillon,confirmée,reçue,annulée'],
        'date_commande' => ['sometimes', 'required', 'date'],
        'date_reception' => ['nullable', 'date'],
        'note' => ['nullable', 'string'],
        'utilisateur_id' => ['nullable', 'integer', 'exists:utilisateurs,id'],
    ];

    public function recevoir(Request $request, string $id)
    {
        $data = $request->validate([
            'date_reception' => ['nullable', 'date'],
        ]);

        $commande = CommandeAchat::query()->with('lignes')->findOrFail($id);

        $result = DB::transaction(function () use ($commande, $data) {
            foreach ($commande->lignes as $ligne) {
                $reste = (float) $ligne->quantite - (float) $ligne->quantite_recue;

                if ($reste <= 0) {
                    continue;
                }

                $ligne->quantite_recue = (float) $ligne->quantite;
                $ligne->save();

                $stock = Stock::query()->firstOrCreate(
                    ['article_id' => $ligne->article_id],
                    ['quantite' => 0, 'seuil_min' => 0]
                );

                $stock->quantite = (float) $stock->quantite + $reste;
                $stock->save();

                MouvementStock::query()->create([
                    'article_id' => $ligne->article_id,
                    'type_mouvement' => 'entree',
                    'motif' => 'achat',
                    'quantite' => $reste,
                    'reference_id' => (int) $commande->id,
                    'reference_type' => 'commande_achat',
                    'utilisateur_id' => $commande->utilisateur_id ?? auth()->id(),
                ]);
            }

            $commande->statut = 'reçue';
            $commande->date_reception = $data['date_reception'] ?? now()->toDateString();
            $commande->save();

            $this->logAction('recevoir', $commande->getTable(), (int) $commande->getKey(), [
                'date_reception' => $commande->date_reception,
            ]);

            return $commande->fresh(['fournisseur', 'utilisateur', 'lignes.article']);
        });

        return response()->json($result);
    }
}

