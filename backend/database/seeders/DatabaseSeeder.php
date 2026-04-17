<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Category;
use App\Models\Client;
use App\Models\CommandeAchat;
use App\Models\CommandeVente;
use App\Models\Fournisseur;
use App\Models\HistoriqueAction;
use App\Models\LigneCommandeAchat;
use App\Models\LigneCommandeVente;
use App\Models\MouvementStock;
use App\Models\PrixArticle;
use App\Models\Promotion;
use App\Models\Role;
use App\Models\Sortie;
use App\Models\SousCategorie;
use App\Models\Stock;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $faker = \Faker\Factory::create('fr_FR');
        $now = now();

        DB::table('roles')->upsert(
            [
                ['nom' => 'admin', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
                ['nom' => 'vendeur', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
                ['nom' => 'magasinier', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
                ['nom' => 'agent', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
                ['nom' => 'livreur', 'description' => null, 'created_at' => $now, 'updated_at' => $now],
            ],
            ['nom'],
            ['updated_at']
        );

        $adminRoleId = DB::table('roles')->where('nom', 'admin')->value('id');
        $vendeurRoleId = DB::table('roles')->where('nom', 'vendeur')->value('id');
        $magasinierRoleId = DB::table('roles')->where('nom', 'magasinier')->value('id');
        $agentRoleId = DB::table('roles')->where('nom', 'agent')->value('id');
        $livreurRoleId = DB::table('roles')->where('nom', 'livreur')->value('id');

        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@elherii.ma'],
            [
                'role_id' => $adminRoleId,
                'nom' => 'Admin',
                'prenom' => 'El Herri',
                'mot_de_passe' => Hash::make('password'),
                'actif' => true,
            ]
        );

        $vendeur = User::query()->updateOrCreate(
            ['email' => 'vendeur@example.com'],
            [
                'role_id' => $vendeurRoleId,
                'nom' => 'Vendeur',
                'prenom' => 'Test',
                'mot_de_passe' => Hash::make('password'),
                'actif' => true,
            ]
        );

        $magasinier = User::query()->updateOrCreate(
            ['email' => 'magasinier@example.com'],
            [
                'role_id' => $magasinierRoleId,
                'nom' => 'Magasin',
                'prenom' => 'ier',
                'mot_de_passe' => Hash::make('password'),
                'actif' => true,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'agent@example.com'],
            [
                'role_id' => $agentRoleId,
                'nom' => 'Agent',
                'prenom' => 'Test',
                'mot_de_passe' => Hash::make('password'),
                'actif' => true,
            ]
        );

        User::query()->updateOrCreate(
            ['email' => 'livreur@example.com'],
            [
                'role_id' => $livreurRoleId,
                'nom' => 'Livreur',
                'prenom' => 'Test',
                'mot_de_passe' => Hash::make('password'),
                'actif' => true,
            ]
        );

        if (
            Category::query()->exists() ||
            SousCategorie::query()->exists() ||
            Article::query()->exists() ||
            Client::query()->exists() ||
            Fournisseur::query()->exists()
        ) {
            return;
        }

        $categories = collect();
        $sousCategories = collect();
        $articles = collect();

        for ($i = 0; $i < 5; $i++) {
            $categories->push(Category::query()->create([
                'nom' => ucfirst($faker->unique()->words(2, true)),
                'description' => $faker->optional()->sentence(10),
            ]));
        }

        foreach ($categories as $category) {
            $countSous = $faker->numberBetween(2, 4);

            for ($j = 0; $j < $countSous; $j++) {
                $sousCategories->push(SousCategorie::query()->create([
                    'categorie_id' => $category->id,
                    'nom' => ucfirst($faker->unique()->words(2, true)),
                    'description' => $faker->optional()->sentence(10),
                ]));
            }
        }

        foreach ($sousCategories as $sc) {
            $countArticles = $faker->numberBetween(5, 10);

            for ($k = 0; $k < $countArticles; $k++) {
                $article = Article::query()->create([
                    'sous_categorie_id' => $sc->id,
                    'code_article' => 'ART-' . strtoupper($faker->unique()->bothify('####??')),
                    'nom' => ucfirst($faker->unique()->words(3, true)),
                    'description' => $faker->optional()->sentence(12),
                    'unite' => $faker->randomElement(['pièce', 'kg', 'L', 'm']),
                    'image' => null,
                    'actif' => true,
                ]);

                $prixAchat = $faker->randomFloat(2, 2, 200);
                $prixVente = round($prixAchat * $faker->randomFloat(2, 1.15, 1.6), 2);
                $prixGros = round($prixVente * $faker->randomFloat(2, 0.85, 0.95), 2);
                $prixPromo = $faker->boolean(30) ? round($prixVente * $faker->randomFloat(2, 0.7, 0.9), 2) : null;

                PrixArticle::query()->create([
                    'article_id' => $article->id,
                    'prix_achat' => $prixAchat,
                    'prix_vente' => $prixVente,
                    'prix_gros' => $prixGros,
                    'prix_promo' => $prixPromo,
                ]);

                Stock::query()->create([
                    'article_id' => $article->id,
                    'quantite' => 0,
                    'seuil_min' => $faker->randomFloat(2, 0, 10),
                ]);

                $articles->push($article);
            }
        }

        $fournisseurs = collect();

        for ($i = 0; $i < 5; $i++) {
            $fournisseurs->push(Fournisseur::query()->create([
                'nom' => ucfirst($faker->company()),
                'telephone' => $faker->optional()->phoneNumber(),
                'email' => $faker->optional()->companyEmail(),
                'adresse' => $faker->optional()->address(),
                'actif' => true,
            ]));
        }

        $commandesAchat = collect();

        for ($i = 0; $i < 10; $i++) {
            $statut = $i < 6 ? 'reçue' : $faker->randomElement(['brouillon', 'confirmée', 'annulée']);
            $dateCommande = $faker->dateTimeBetween('-45 days', '-5 days')->format('Y-m-d');
            $dateReception = $statut === 'reçue'
                ? $faker->dateTimeBetween($dateCommande, 'now')->format('Y-m-d')
                : null;

            $commande = CommandeAchat::query()->create([
                'fournisseur_id' => $fournisseurs->random()->id,
                'statut' => $statut,
                'date_commande' => $dateCommande,
                'date_reception' => $dateReception,
                'note' => $faker->optional()->sentence(8),
                'utilisateur_id' => $magasinier->id,
            ]);

            $commandesAchat->push($commande);

            $lignesCount = $faker->numberBetween(2, 5);
            $pickedArticleIds = [];

            for ($j = 0; $j < $lignesCount; $j++) {
                $article = $articles->whereNotIn('id', $pickedArticleIds)->random();
                $pickedArticleIds[] = $article->id;

                $prixAchat = (float) PrixArticle::query()->where('article_id', $article->id)->value('prix_achat');
                $quantite = $faker->randomFloat(2, 5, 80);
                $quantiteRecue = $statut === 'reçue'
                    ? $quantite
                    : ($statut === 'confirmée' ? $faker->randomFloat(2, 0, $quantite) : 0);

                LigneCommandeAchat::query()->create([
                    'commande_achat_id' => $commande->id,
                    'article_id' => $article->id,
                    'quantite' => $quantite,
                    'quantite_recue' => $quantiteRecue,
                    'prix_unitaire' => $prixAchat,
                ]);

                if ($quantiteRecue > 0) {
                    $stock = Stock::query()->where('article_id', $article->id)->firstOrFail();
                    $stock->quantite = (float) $stock->quantite + (float) $quantiteRecue;
                    $stock->save();

                    MouvementStock::query()->create([
                        'article_id' => $article->id,
                        'type_mouvement' => 'entree',
                        'motif' => 'achat',
                        'quantite' => $quantiteRecue,
                        'reference_id' => $commande->id,
                        'reference_type' => 'commande_achat',
                        'utilisateur_id' => $magasinier->id,
                        'note' => null,
                    ]);
                }
            }
        }

        $clients = collect();

        for ($i = 0; $i < 12; $i++) {
            $clients->push(Client::query()->create([
                'nom' => $faker->name(),
                'telephone' => $faker->optional()->phoneNumber(),
                'email' => $faker->optional()->safeEmail(),
                'adresse' => $faker->optional()->address(),
                'type_client' => $faker->randomElement(['detail', 'gros']),
                'actif' => true,
            ]));
        }

        $stockByArticle = Stock::query()->pluck('quantite', 'article_id')->map(fn($v) => (float) $v)->toArray();
        $articlesById = $articles->keyBy('id');

        for ($i = 0; $i < 15; $i++) {
            $statut = $i < 8 ? 'payée' : $faker->randomElement(['en_attente', 'confirmée', 'annulée']);
            $client = $clients->random();

            $commande = CommandeVente::query()->create([
                'client_id' => $client->id,
                'statut' => $statut,
                'date_commande' => $faker->dateTimeBetween('-10 days', 'now'),
                'note' => $faker->optional()->sentence(8),
                'utilisateur_id' => $vendeur->id,
            ]);

            $lignesCount = $faker->numberBetween(1, 4);
            $picked = [];
            $montantTotal = 0.0;
            $montantRemise = 0.0;
            $linesCreated = 0;

            for ($j = 0; $j < $lignesCount; $j++) {
                $candidates = array_filter($stockByArticle, fn($q) => $q > 0);
                if (!$candidates) {
                    break;
                }

                $articleId = (int) array_rand($candidates);
                if (isset($picked[$articleId])) {
                    continue;
                }
                $picked[$articleId] = true;

                $article = $articlesById->get($articleId);
                if (!$article) {
                    continue;
                }

                $prix = PrixArticle::query()->where('article_id', $articleId)->first();
                $prixUnitaire = $client->type_client === 'gros'
                    ? (float) ($prix->prix_gros ?? $prix->prix_vente)
                    : (float) $prix->prix_vente;

                $quantiteMax = max(1.0, min(20.0, $stockByArticle[$articleId]));
                $quantite = $faker->randomFloat(2, 1, $quantiteMax);
                $remise = $faker->boolean(20) ? $faker->randomFloat(2, 1, 10) : 0;

                LigneCommandeVente::query()->create([
                    'commande_vente_id' => $commande->id,
                    'article_id' => $articleId,
                    'quantite' => $quantite,
                    'prix_unitaire' => $prixUnitaire,
                    'remise' => $remise,
                ]);
                $linesCreated++;

                $ligneTotal = $quantite * $prixUnitaire;
                $ligneRemise = $ligneTotal * ($remise / 100.0);
                $montantTotal += $ligneTotal;
                $montantRemise += $ligneRemise;

                if ($statut === 'payée') {
                    $stockByArticle[$articleId] -= $quantite;
                    Stock::query()->where('article_id', $articleId)->update([
                        'quantite' => DB::raw('quantite - ' . (float) $quantite),
                    ]);

                    MouvementStock::query()->create([
                        'article_id' => $articleId,
                        'type_mouvement' => 'sortie',
                        'motif' => 'vente',
                        'quantite' => $quantite,
                        'reference_id' => $commande->id,
                        'reference_type' => 'vente',
                        'utilisateur_id' => $vendeur->id,
                    ]);
                }
            }

            if ($statut === 'payée' && $linesCreated > 0) {
                $montantPaye = max(0.0, $montantTotal - $montantRemise);

                $vente = \App\Models\Vente::query()->create([
                    'commande_vente_id' => $commande->id,
                    'client_id' => $commande->client_id,
                    'montant_total' => $montantTotal,
                    'montant_remise' => $montantRemise,
                    'montant_paye' => $montantPaye,
                    'mode_paiement' => $faker->randomElement(['espèces', 'carte', 'virement', 'chèque']),
                    'date_vente' => now(),
                    'utilisateur_id' => $vendeur->id,
                ]);

                HistoriqueAction::query()->create([
                    'utilisateur_id' => $vendeur->id,
                    'action' => 'payer',
                    'table_cible' => 'commandes_vente',
                    'enregistrement_id' => $commande->id,
                    'details' => [
                        'vente_id' => $vente->id,
                        'montant_total' => $montantTotal,
                        'montant_remise' => $montantRemise,
                        'montant_paye' => $montantPaye,
                    ],
                ]);
            } elseif ($statut === 'payée') {
                $commande->statut = 'en_attente';
                $commande->save();
            }
        }

        for ($i = 0; $i < 6; $i++) {
            $candidates = array_filter($stockByArticle, fn($q) => $q > 0);
            if (!$candidates) {
                break;
            }

            $articleId = (int) array_rand($candidates);
            $qteMax = max(1.0, min(10.0, $stockByArticle[$articleId]));
            $qte = $faker->randomFloat(2, 1, $qteMax);
            $motif = $faker->randomElement(['perte', 'don', 'ajustement']);

            $sortie = Sortie::query()->create([
                'article_id' => $articleId,
                'motif' => $motif,
                'quantite' => $qte,
                'note' => $faker->optional()->sentence(6),
                'utilisateur_id' => $magasinier->id,
            ]);

            $stockByArticle[$articleId] -= $qte;
            Stock::query()->where('article_id', $articleId)->update([
                'quantite' => DB::raw('quantite - ' . (float) $qte),
            ]);

            MouvementStock::query()->create([
                'article_id' => $articleId,
                'type_mouvement' => 'sortie',
                'motif' => $motif,
                'quantite' => $qte,
                'reference_id' => $sortie->id,
                'reference_type' => 'sortie',
                'utilisateur_id' => $magasinier->id,
            ]);
        }

        for ($i = 0; $i < 8; $i++) {
            $type = $faker->randomElement(['pourcentage', 'montant_fixe']);
            $targetType = $faker->randomElement(['article', 'category', 'client']);

            $targetId = match ($targetType) {
                'article' => $articles->random()->id,
                'category' => $categories->random()->id,
                default => $clients->random()->id,
            };

            $start = $faker->dateTimeBetween('-10 days', '+10 days')->format('Y-m-d');
            $end = $faker->dateTimeBetween($start, '+30 days')->format('Y-m-d');

            Promotion::query()->create([
                'name' => 'Promo ' . $faker->unique()->word(),
                'type' => $type,
                'value' => $type === 'pourcentage'
                    ? $faker->randomFloat(2, 5, 40)
                    : $faker->randomFloat(2, 1, 50),
                'start_date' => $start,
                'end_date' => $end,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'is_active' => $faker->boolean(70),
            ]);
        }

        $tables = [
            'categories',
            'sous_categories',
            'articles',
            'stock',
            'prix_articles',
            'fournisseurs',
            'commandes_achat',
            'lignes_commande_achat',
            'clients',
            'commandes_vente',
            'lignes_commande_vente',
            'ventes',
            'promotions',
            'mouvements_stock',
            'sorties',
        ];

        for ($i = 0; $i < 12; $i++) {
            HistoriqueAction::query()->create([
                'utilisateur_id' => $faker->randomElement([$admin->id, $vendeur->id, $magasinier->id]),
                'action' => $faker->randomElement(['create', 'update', 'delete', 'import', 'export']),
                'table_cible' => $faker->randomElement($tables),
                'enregistrement_id' => $faker->optional()->numberBetween(1, 100),
                'details' => $faker->boolean(50) ? ['note' => $faker->sentence(8)] : null,
            ]);
        }
    }
}
