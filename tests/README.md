# Tests - Tournoi de Coinche

Ce dossier contient tous les fichiers de test pour l'application de gestion de tournoi de coinche.

## Fichiers de test HTML

### Tests des modèles

- **test-models.html** - Test des Modèles de Données
  - Teste les classes Team, Match, Pool, Bracket et Tournament
  - Vérifie la création, la sérialisation (toJSON/fromJSON)
  - Teste le calcul du goal average et des statistiques
  - Simule une phase de poules complète
  - Teste la sauvegarde/chargement depuis localStorage

### Tests des vues et composants

- **test-pool-phase-view.html** - Test Pool Phase View
  - Teste l'affichage de la vue de phase de poules
  - Vérifie le rendu des poules et des classements
  - Teste l'interaction avec l'interface utilisateur

- **test-bracket-view.html** - Test BracketView
  - Teste l'affichage du bracket (tableau éliminatoire)
  - Vérifie la génération et l'affichage des rounds
  - Teste la progression des équipes dans le bracket

- **test-correction-view.html** - Test CorrectionView
  - Teste l'interface de correction des scores
  - Vérifie la modification des résultats de matches
  - Teste la mise à jour des statistiques après correction

- **test-match-sheet.html** - Test Feuille de Matches
  - Teste la génération et l'affichage des feuilles de match
  - Vérifie le format d'impression
  - Teste l'export PDF des feuilles de match

### Tests de la logique métier

- **test-pool-matches.html** - Test Génération des Matches de Poule
  - Teste l'algorithme de génération des matches en poule
  - Vérifie que toutes les équipes s'affrontent une fois
  - Teste différentes configurations de poules (4, 5, 6 équipes)

- **test-ranking.html** - Tests Classement et Qualification
  - Teste l'algorithme de classement des équipes
  - Vérifie les départages (victoires > goal average > points marqués)
  - Teste la sélection des équipes qualifiées (1ers, 2èmes, meilleurs 3èmes)
  - Simule des cas d'égalité complexes

- **test-small-tournament.html** - Test Petit Tournoi (8 équipes)
  - Teste la configuration des petits tournois (4-14 équipes)
  - Vérifie le calcul automatique des poules
  - Teste le passage automatique à la phase bracket
  - Simule un tournoi complet de bout en bout

### Tests d'import/export

- **test-export-import.html** - Test Export/Import
  - Teste l'export des données du tournoi en JSON
  - Vérifie l'import depuis un fichier JSON
  - Interface manuelle pour tester le téléchargement et le chargement

- **test-export-import-auto.html** - Test Automatisé Export/Import
  - Tests automatisés de l'export/import
  - Vérifie l'intégrité des données après round-trip (export → import → export)
  - Teste les cas limites (tournoi vide, avec bracket, etc.)
  - Affiche un rapport détaillé des tests

- **test-visual-check.html** - Vérification Visuelle Export/Import
  - Checklist manuelle pour vérifier visuellement l'export/import
  - Guide pas à pas pour tester la sauvegarde et la restauration
  - Vérifie que toutes les données sont préservées

## Fichiers de test Node.js

- **verify-implementation.js** - Script de vérification de l'implémentation
  - Script Node.js pour vérifier la logique des brackets
  - Calcule et affiche les configurations attendues
  - Valide le nombre de rounds pour différentes tailles de tournoi
  - Exécution : `node verify-implementation.js`

## Utilisation

### Exécuter les tests HTML

1. Ouvrir le fichier test HTML souhaité dans un navigateur web
2. Les tests s'exécutent automatiquement au chargement de la page
3. Les résultats s'affichent avec des indicateurs de succès/échec

### Exécuter le script Node.js

```bash
cd tests
node verify-implementation.js
```

## Organisation des tests

- **Tests unitaires** : test-models.html
- **Tests d'intégration** : test-pool-matches.html, test-ranking.html
- **Tests de bout en bout** : test-small-tournament.html
- **Tests d'interface** : test-*-view.html
- **Tests de données** : test-export-import*.html

## Notes

- Tous les chemins d'import ont été mis à jour pour pointer vers `../js/` et `../css/`
- Les tests utilisent des données de démonstration et ne modifient pas les données réelles
- La plupart des tests peuvent être exécutés indépendamment les uns des autres
