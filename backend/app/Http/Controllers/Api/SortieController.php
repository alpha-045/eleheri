<?php

namespace App\Http\Controllers\Api;

use App\Models\MouvementStock;
use App\Models\Sortie;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SortieController extends CrudController
{
    protected string $modelClass = Sortie::class;

    protected array $with = ['article', 'utilisateur'];

    protected array $storeRules = [
        'article_id' => ['required', 'integer', 'exists:articles,id'],
        'motif' => ['required', 'in:perte,don,ajustement'],
        'quantite' => ['required', 'numeric', 'gt:0'],
        'note' => ['nullable', 'string'],
        'utilisateur_id' => ['nullable', 'integer', 'exists:utilisateurs,id'],
    ];

    protected array $updateRules = [
        'note' => ['nullable', 'string'],
    ];

    public function store(Request $request)
    {
        $data = $request->validate($this->storeRules);

        $result = DB::transaction(function () use ($data) {
            $sortie = Sortie::query()->create([
                'article_id' => $data['article_id'],
                'motif' => $data['motif'],
                'quantite' => $data['quantite'],
                'note' => $data['note'] ?? null,
                'utilisateur_id' => $data['utilisateur_id'] ?? auth()->id(),
            ]);

            $stock = Stock::query()->firstOrCreate(
                ['article_id' => $sortie->article_id],
                ['quantite' => 0, 'seuil_min' => 0]
            );

            $stock->quantite = (float) $stock->quantite - (float) $sortie->quantite;
            $stock->save();

            MouvementStock::query()->create([
                'article_id' => $sortie->article_id,
                'type_mouvement' => 'sortie',
                'motif' => $sortie->motif,
                'quantite' => $sortie->quantite,
                'reference_id' => (int) $sortie->id,
                'reference_type' => 'sortie',
                'utilisateur_id' => $sortie->utilisateur_id,
            ]);

            $this->logAction('create', $sortie->getTable(), (int) $sortie->getKey(), $data);

            return $sortie->fresh(['article', 'utilisateur']);
        });

        return response()->json($result, 201);
    }
}

