<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HistoriqueAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

abstract class CrudController extends Controller
{
    protected string $modelClass;

    protected array $with = [];

    protected array $storeRules = [];

    protected array $updateRules = [];

    public function index(Request $request)
    {
        $query = ($this->modelClass)::query();

        if ($this->with) {
            $query->with($this->with);
        }

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));

        return response()->json($query->paginate($perPage));
    }

    public function show(string $id)
    {
        $query = ($this->modelClass)::query();

        if ($this->with) {
            $query->with($this->with);
        }

        return response()->json($query->findOrFail($id));
    }

    public function store(Request $request)
    {
        $data = $this->storeRules ? $request->validate($this->storeRules) : $request->all();

        /** @var Model $model */
        $model = new $this->modelClass();
        $model->fill($data);
        $model->save();

        $this->logAction('create', $model->getTable(), (int) $model->getKey(), $data);

        return response()->json($model, 201);
    }

    public function update(Request $request, string $id)
    {
        /** @var Model $model */
        $model = ($this->modelClass)::query()->findOrFail($id);

        $data = $this->updateRules ? $request->validate($this->updateRules) : $request->all();

        $model->fill($data);
        $model->save();

        $this->logAction('update', $model->getTable(), (int) $model->getKey(), $data);

        return response()->json($model);
    }

    public function destroy(string $id)
    {
        /** @var Model $model */
        $model = ($this->modelClass)::query()->findOrFail($id);
        $table = $model->getTable();
        $key = (int) $model->getKey();

        $model->delete();

        $this->logAction('delete', $table, $key);

        return response()->json(['deleted' => true]);
    }

    protected function logAction(string $action, string $table, ?int $recordId = null, array $details = []): void
    {
        HistoriqueAction::query()->create([
            'utilisateur_id' => auth()->id(),
            'action' => $action,
            'table_cible' => $table,
            'enregistrement_id' => $recordId,
            'details' => $details ?: null,
        ]);
    }
}

