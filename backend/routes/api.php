<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\CommandeAchatController;
use App\Http\Controllers\Api\CommandeVenteController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
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

Route::middleware(['auth:sanctum', 'permission:systeme.stats'])->get('admin/dashboard/stats', [DashboardController::class, 'stats']);
Route::middleware(['auth:sanctum', 'permission:systeme.stats'])->get('admin/notifications', [NotificationController::class, 'index']);

Route::middleware(['auth:sanctum', 'permission:utilisateurs.manage|systeme.settings'])->group(function () {
    Route::get('roles', [RoleController::class, 'index']);
    Route::get('roles/{role}', [RoleController::class, 'show']);
});
Route::middleware(['auth:sanctum', 'permission:systeme.settings'])->group(function () {
    Route::post('roles', [RoleController::class, 'store']);
    Route::put('roles/{role}', [RoleController::class, 'update']);
    Route::patch('roles/{role}', [RoleController::class, 'update']);
    Route::delete('roles/{role}', [RoleController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'permission:utilisateurs.view|systeme.settings'])->group(function () {
    Route::get('utilisateurs', [UtilisateurController::class, 'index']);
    Route::get('utilisateurs/{utilisateur}', [UtilisateurController::class, 'show']);
});
Route::middleware(['auth:sanctum', 'permission:utilisateurs.manage|systeme.settings'])->group(function () {
    Route::post('utilisateurs', [UtilisateurController::class, 'store']);
    Route::put('utilisateurs/{utilisateur}', [UtilisateurController::class, 'update']);
    Route::patch('utilisateurs/{utilisateur}', [UtilisateurController::class, 'update']);
    Route::delete('utilisateurs/{utilisateur}', [UtilisateurController::class, 'destroy']);
});
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
Route::middleware(['auth:sanctum', 'permission:commandes.view'])->group(function () {
    Route::get('commandes_vente', [CommandeVenteController::class, 'index']);
    Route::get('commandes_vente/{commande_vente}', [CommandeVenteController::class, 'show']);
});
Route::middleware(['auth:sanctum', 'permission:commandes.edit'])->group(function () {
    Route::put('commandes_vente/{commande_vente}', [CommandeVenteController::class, 'update']);
    Route::patch('commandes_vente/{commande_vente}', [CommandeVenteController::class, 'update']);
    Route::post('commandes_vente/{id}/confirmer', [CommandeVenteController::class, 'confirmer']);
    Route::post('commandes_vente/{id}/payer', [CommandeVenteController::class, 'payer']);
});
Route::middleware(['auth:sanctum', 'permission:commandes.cancel'])->delete('commandes_vente/{commande_vente}', [CommandeVenteController::class, 'destroy']);
Route::apiResource('lignes_commande_vente', LigneCommandeVenteController::class);
Route::apiResource('ventes', VenteController::class)->only(['index', 'show']);

Route::apiResource('promotions', PromotionController::class);
