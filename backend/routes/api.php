<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CommandeAchatController;
use App\Http\Controllers\Api\CommandeVenteController;
use App\Http\Controllers\Api\FournisseurController;
use App\Http\Controllers\Api\HistoriqueActionController;
use App\Http\Controllers\Api\LigneCommandeAchatController;
use App\Http\Controllers\Api\LigneCommandeVenteController;
use App\Http\Controllers\Api\MouvementStockController;
use App\Http\Controllers\Api\PrixArticleController;
use App\Http\Controllers\Api\PromotionController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SortieController;
use App\Http\Controllers\Api\SousCategorieController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\UtilisateurController;
use App\Http\Controllers\Api\VenteController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn() => response()->json(['ok' => true]));

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->get('me', [AuthController::class, 'me']);
    Route::middleware('auth:sanctum')->post('logout', [AuthController::class, 'logout']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->get('admin/dashboard', fn() => response()->json([
    'message' => 'hi admin',
]));

Route::apiResource('roles', RoleController::class);
Route::apiResource('utilisateurs', UtilisateurController::class);
Route::apiResource('historique_actions', HistoriqueActionController::class)->only(['index', 'show']);

Route::apiResource('categories', CategoryController::class);
Route::apiResource('sous_categories', SousCategorieController::class);
Route::apiResource('articles', ArticleController::class);
Route::apiResource('prix_articles', PrixArticleController::class);

Route::apiResource('stock', StockController::class);
Route::apiResource('mouvements_stock', MouvementStockController::class)->only(['index', 'show', 'store']);
Route::apiResource('sorties', SortieController::class);

Route::apiResource('fournisseurs', FournisseurController::class);
Route::apiResource('commandes_achat', CommandeAchatController::class);
Route::post('commandes_achat/{id}/recevoir', [CommandeAchatController::class, 'recevoir']);
Route::apiResource('lignes_commande_achat', LigneCommandeAchatController::class);

Route::apiResource('clients', ClientController::class);
Route::apiResource('commandes_vente', CommandeVenteController::class);
Route::post('commandes_vente/{id}/confirmer', [CommandeVenteController::class, 'confirmer']);
Route::post('commandes_vente/{id}/payer', [CommandeVenteController::class, 'payer']);
Route::apiResource('lignes_commande_vente', LigneCommandeVenteController::class);
Route::apiResource('ventes', VenteController::class)->only(['index', 'show']);

Route::apiResource('promotions', PromotionController::class);
