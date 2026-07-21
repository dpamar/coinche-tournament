# Modèles de Données - Tournoi de Coinche

Ce dossier contient les classes JavaScript pour gérer la logique métier du tournoi de coinche.

## Architecture

```
Tournament (Tournoi)
├── Teams (Map d'équipes)
├── Pools (Poules)
│   ├── Teams (références aux équipes)
│   └── Matches (matches de poule)
└── Bracket (Tableau éliminatoire)
    └── Rounds (tours)
        └── Matches (matches éliminatoires)
```

## Classes

### 1. Team.js

Représente une équipe du tournoi.

**Propriétés:**
- `id` : Identifiant unique
- `name` : Nom de l'équipe
- `matchesPlayed` : Nombre de matches joués
- `matchesWon` : Nombre de victoires
- `pointsScored` : Points marqués
- `pointsConceded` : Points encaissés

**Méthodes:**
- `getGoalAverage()` : Calcule le goal average (pointsScored - pointsConceded)
- `toJSON()` : Sérialise l'équipe en JSON
- `static fromJSON(json)` : Crée une équipe depuis un objet JSON

**Exemple:**
```javascript
const team = new Team('Les Coincheurs', 'team_1');
team.matchesWon = 3;
team.pointsScored = 450;
console.log(team.getGoalAverage()); // 450 - 0 = 450
```

### 2. Match.js

Représente un match entre deux équipes.

**Propriétés:**
- `team1Id` : ID de l'équipe 1
- `team2Id` : ID de l'équipe 2
- `type` : Type de match ('pool' ou 'knockout')
- `score1` : Score de l'équipe 1
- `score2` : Score de l'équipe 2
- `isPlayed` : Match joué ou non

**Méthodes:**
- `setScore(score1, score2)` : Enregistre les scores
- `getWinner()` : Retourne l'ID du gagnant (ou null)
- `toJSON()` : Sérialise le match en JSON
- `static fromJSON(json)` : Crée un match depuis un objet JSON

**Exemple:**
```javascript
const match = new Match('team_1', 'team_2', 'pool');
match.setScore(180, 120);
console.log(match.getWinner()); // 'team_1'
```

### 3. Pool.js

Représente une poule de 4 ou 5 équipes.

**Propriétés:**
- `id` : Identifiant de la poule
- `teams` : Array d'IDs d'équipes
- `matches` : Array de matches

**Méthodes:**
- `generateMatches()` : Génère tous les matches (round-robin)
  - 4 équipes → 6 matches
  - 5 équipes → 10 matches
- `getRanking(teamsMap)` : Retourne le classement trié
  - Critère 1 : Victoires
  - Critère 2 : Goal average
  - Critère 3 : Points marqués
- `toJSON()` : Sérialise la poule en JSON
- `static fromJSON(json)` : Crée une poule depuis un objet JSON

**Exemple:**
```javascript
const pool = new Pool('pool_1', ['team_1', 'team_2', 'team_3', 'team_4']);
pool.generateMatches();
console.log(pool.matches.length); // 6 matches

const ranking = pool.getRanking(tournament.teams);
console.log(ranking[0]); // Meilleure équipe de la poule
```

### 4. Bracket.js

Représente le tableau éliminatoire à 16 équipes.

**Propriétés:**
- `teams` : Array de 16 IDs d'équipes qualifiées
- `rounds` : Array de tours
  - `rounds[0]` : Huitièmes de finale (8 matches)
  - `rounds[1]` : Quarts de finale (4 matches)
  - `rounds[2]` : Demi-finales (2 matches)
  - `rounds[3]` : Finale (1 match)

**Méthodes:**
- `generateRound(teams)` : Génère un tour (1 vs 16, 2 vs 15, etc.)
- `initializeBracket()` : Initialise le premier tour
- `advanceWinners(roundIndex)` : Fait passer les gagnants au tour suivant
- `getChampion()` : Retourne l'ID du champion (si finale jouée)
- `static getRoundName(roundIndex)` : Retourne le nom du tour
- `toJSON()` : Sérialise le bracket en JSON
- `static fromJSON(json)` : Crée un bracket depuis un objet JSON

**Exemple:**
```javascript
const bracket = new Bracket([...16 teamIds]);
bracket.initializeBracket();
console.log(bracket.rounds[0].length); // 8 matches

// Jouer les matches du premier tour
bracket.rounds[0].forEach(match => match.setScore(180, 120));

// Faire avancer les gagnants
bracket.advanceWinners(0);
console.log(bracket.rounds[1].length); // 4 matches (quarts)
```

### 5. Tournament.js

Classe principale gérant tout le tournoi.

**Propriétés:**
- `name` : Nom du tournoi
- `teams` : Map<id, Team> de toutes les équipes
- `pools` : Array de poules
- `bracket` : Bracket (phase éliminatoire)
- `phase` : Phase actuelle
  - 'setup' : Configuration initiale
  - 'pool' : Phase de poules
  - 'bracket' : Phase éliminatoire
  - 'finished' : Tournoi terminé
- `nextTeamId` : Compteur pour générer les IDs

**Méthodes:**
- `addTeam(name)` : Ajoute une équipe
- `createPools(poolSizes)` : Crée les poules avec les tailles données
- `getQualifiedTeams()` : Retourne les 16 meilleures équipes
  - 2 premières de chaque poule
  - + 8 meilleurs 3èmes
- `startBracketPhase()` : Démarre la phase éliminatoire
- `isPoolPhaseReady()` : Vérifie si tous les matches de poule sont joués
- `isBracketRoundReady(roundIndex)` : Vérifie si un tour est terminé
- `isBracketPhaseReady()` : Vérifie si le tournoi est terminé
- `updateTeamStats(match)` : Met à jour les stats d'équipes après un match
- `toJSON()` : Sérialise le tournoi en JSON
- `static fromJSON(json)` : Crée un tournoi depuis un objet JSON
- `save()` : Sauvegarde dans localStorage
- `static load()` : Charge depuis localStorage

**Exemple complet:**
```javascript
// Créer un tournoi
const tournament = new Tournament('Tournoi de Coinche 2026');

// Ajouter 18 équipes
for (let i = 1; i <= 18; i++) {
  tournament.addTeam(`Équipe ${i}`);
}

// Créer 4 poules (4, 4, 5, 5)
tournament.createPools([4, 4, 5, 5]);

// Jouer les matches de poule
tournament.pools.forEach(pool => {
  pool.matches.forEach(match => {
    match.setScore(180, 120);
  });
});

// Vérifier si la phase de poules est terminée
if (tournament.isPoolPhaseReady()) {
  // Démarrer la phase éliminatoire
  tournament.startBracketPhase();
  
  // Afficher les équipes qualifiées
  console.log(tournament.bracket.teams); // 16 équipes
}

// Sauvegarder
tournament.save();

// Charger plus tard
const loaded = Tournament.load();
```

## Logique de Qualification

Pour passer en phase éliminatoire, 16 équipes sont qualifiées:

1. **Premières de poule** : Les 2 meilleures équipes de chaque poule (8 équipes)
2. **Meilleurs 3èmes** : Les 8 meilleurs 3èmes parmi toutes les poules

**Critères de classement:**
1. Nombre de victoires (décroissant)
2. Goal average (décroissant)
3. Points marqués (décroissant)

## Sérialisation

Toutes les classes supportent la sérialisation JSON via:
- `toJSON()` : Convertit l'objet en JSON
- `static fromJSON(json)` : Reconstruit l'objet depuis JSON

Le tournoi peut être sauvegardé dans le localStorage:
```javascript
tournament.save(); // Sauvegarde
const loaded = Tournament.load(); // Chargement
```

## Tests

Un fichier de test est disponible: `/test-models.html`

Ouvrez ce fichier dans un navigateur pour vérifier que tous les modèles fonctionnent correctement.
