<?php

namespace App\Http\Controllers\Api;

use App\Models\Article;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

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
        'image' => ['required','image'],
        'actif' => ['nullable', 'boolean'],
    ];

    protected array $updateRules = [
        'sous_categorie_id' => ['sometimes', 'required', 'integer', 'exists:sous_categories,id'],
        'code_article' => ['sometimes', 'required', 'string', 'max:50'],
        'nom' => ['sometimes', 'required', 'string', 'max:150'],
        'description' => ['nullable', 'string'],
        'unite' => ['nullable', 'string', 'max:20'],
        'image' => ['nullable', 'image'],
        'actif' => ['nullable', 'boolean'],
    ];

    public function store(Request $request)
    {
        $data = $request->validate($this->storeRules);

        /** @var Article $model */
        $model = new $this->modelClass();

        try {
            $path = Storage::disk('public')->putFile('articles', $request->file('image'));
            $data['image'] = Storage::url($path);

            $model->fill($data);
            $model->save();
        } catch (QueryException $e) {
            if ($this->isFkConstraint($e)) {
                return response()->json([
                    'message' => $this->fkMessage($e, $model),
                    'code' => 'FK_CONSTRAINT',
                    'constraint' => $this->extractConstraintName($e),
                ], 409);
            }
            throw $e;
        }
        $this->logAction('create', $model->getTable(), (int) $model->getKey(), $data);
        $model->load($this->with);
        return response()->json($model, 201);
    }

    public function update(Request $request, string $id)
    {
        /** @var Article $model */
        $model = ($this->modelClass)::query()->findOrFail($id);

        $rules = $this->updateRules;
        $rules['code_article'] = [
            'sometimes',
            'required',
            'string',
            'max:50',
            Rule::unique('articles', 'code_article')->ignore($model->id),
        ];

        $data = $request->validate($rules);

        try {
            if ($request->hasFile('image')) {
                $this->deletePublicFileIfAny($model->image);
                $path = Storage::disk('public')->putFile('articles', $request->file('image'));
                $data['image'] = Storage::url($path);
            }

            $model->fill($data);
            $model->save();
        } catch (QueryException $e) {
            if ($this->isFkConstraint($e)) {
                return response()->json([
                    'message' => $this->fkMessage($e, $model),
                    'code' => 'FK_CONSTRAINT',
                    'constraint' => $this->extractConstraintName($e),
                ], 409);
            }
            throw $e;
        }

        $this->logAction('update', $model->getTable(), (int) $model->getKey(), $data);

        $model->load($this->with);
        return response()->json($model);
    }

    private function deletePublicFileIfAny(?string $url): void
    {
        if (!$url) return;
        if (!str_starts_with($url, '/storage/')) return;
        $path = ltrim(substr($url, strlen('/storage/')), '/');
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
