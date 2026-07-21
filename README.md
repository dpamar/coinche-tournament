# Tournoi de Coinche

Application web de gestion de tournois de coinche avec phase de poules et phase éliminatoire.

## 🎯 Fonctionnalités

- **Inscription progressive des équipes** : ajoutez les équipes au fur et à mesure sans connaître le nombre total à l'avance
- **Phase de poules** : organisation automatique en poules de 4 ou 5 équipes avec matches inter-poules
- **Classement automatique** : victoires > goal average > points marqués
- **Phase éliminatoire** : brackets de 4, 8, 16 ou 32 équipes selon le nombre de qualifiés
- **Petits tournois** : support des tournois de 8 à 14 équipes avec demi-finales directes
- **Correction de scores** : interface dédiée pour corriger les scores après saisie
- **Feuille de matches** : génération d'une feuille imprimable pour annoncer les matches
- **Export/Import** : sauvegarde et restauration complète du tournoi en JSON
- **Sauvegarde automatique** : progression enregistrée dans le navigateur

## 🚀 Démarrage rapide

### Prérequis
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Un serveur web local (optionnel mais recommandé)

### Lancement

**Option 1 : Serveur Python**
```bash
python3 -m http.server 8080
```
Puis ouvrir http://localhost:8080/

**Option 2 : Serveur Node.js**
```bash
npx http-server -p 8080
```

**Option 3 : Ouvrir directement**
Ouvrir `index.html` dans un navigateur (certaines fonctionnalités peuvent ne pas fonctionner)

## 📖 Utilisation

### 1. Créer un tournoi
1. Cliquer sur "Nouveau Tournoi"
2. Entrer le nom du tournoi
3. Ajouter les équipes une par une (nombre pair requis)

### 2. Choisir le format
- **4 équipes** : Demi-finales directes (8-14 équipes)
- **8 équipes** : Quarts de finale (≥16 équipes)
- **16 équipes** : Huitièmes de finale (≥24 équipes)
- **32 équipes** : Seizièmes de finale (≥48 équipes)

### 3. Organiser les poules
- Les poules de 5 sont créées en premier
- Distribution automatique ou mélange manuel
- Validation de la configuration

### 4. Phase de poules
- Saisir les scores de chaque match
- Consulter les classements en temps réel
- Les poules de 5 jouent des matches inter-poules

### 5. Phase éliminatoire
- Les meilleures équipes se qualifient automatiquement
- Tableau à élimination directe
- Podium final avec 1er, 2ème et 3èmes

## 🏗️ Architecture

```
coinche-tournament/
├── index.html              # Point d'entrée
├── css/
│   └── style.css          # Styles complets
├── js/
│   ├── app.js             # Application principale
│   ├── router.js          # Routage SPA
│   ├── models/            # Modèles de données
│   │   ├── Team.js
│   │   ├── Match.js
│   │   ├── Pool.js
│   │   ├── Bracket.js
│   │   └── Tournament.js
│   ├── managers/
│   │   └── StorageManager.js
│   ├── components/        # Composants réutilisables
│   │   ├── Button.js
│   │   ├── Form.js
│   │   └── Table.js
│   └── views/             # Vues de l'application
│       ├── HomeView.js
│       ├── SetupView.js
│       ├── PoolPhaseView.js
│       ├── BracketView.js
│       ├── CorrectionView.js
│       └── MatchSheetView.js
└── tests/                 # Tests et validation
```

## 🎮 Technologies

- **Vanilla JavaScript (ES6+)** : pas de framework, code pur
- **HTML5 / CSS3** : interface responsive
- **LocalStorage API** : persistence des données
- **Hash-based routing** : navigation SPA

## 📊 Règles de classement

### Phase de poules
1. Nombre de victoires (décroissant)
2. Goal average (points marqués - points encaissés)
3. Points marqués (décroissant)

### Qualification
- Tous les 1ers sont qualifiés
- Complété par les meilleurs 2èmes
- Si nécessaire, les meilleurs 3èmes

## 🧪 Tests

Les tests sont disponibles dans le dossier `tests/` :
- Tests unitaires des modèles
- Tests d'intégration des vues
- Tests de l'export/import
- Tests visuels

Voir `tests/README.md` pour plus de détails.

## 💾 Format d'export

Les tournois sont exportés au format JSON avec :
- Nom et phase du tournoi
- Liste complète des équipes avec statistiques
- Configuration des poules et matches
- État du bracket éliminatoire
- Scores et résultats

## 🤝 Contribution

Pour contribuer au projet, voir `CLAUDE.md` pour la documentation technique détaillée.

## 📝 Licence

Projet libre d'utilisation.

## 🏆 Crédits

Application développée avec Claude Code pour la gestion de tournois de coinche.
