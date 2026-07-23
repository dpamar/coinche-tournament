# Documentation technique - Tournoi de Coinche

Documentation pour Claude Code et les développeurs souhaitant comprendre ou modifier le code.

## 🏗️ Architecture globale

### Modèle MVC-like
- **Models** : logique métier et données (Team, Match, Pool, Bracket, Tournament)
- **Views** : génération du HTML et gestion des événements
- **Components** : composants réutilisables (Button, Form, Table)
- **Managers** : services transverses (StorageManager)
- **App** : orchestration et routing

### Principes de conception
- **Vanilla JS** : aucune dépendance externe
- **SPA** : Single Page Application avec hash routing
- **Immutabilité partielle** : les modèles sont modifiés en place puis sauvegardés
- **Serialization** : toJSON/fromJSON pour la persistence
- **XSS Protection** : escapeHtml() systématique pour l'affichage

## 📦 Modèles de données

### Team (js/models/Team.js)
```javascript
{
  id: string,           // Unique ID
  name: string,         // Nom de l'équipe
  matchesPlayed: number,
  matchesWon: number,
  pointsScored: number,
  pointsConceded: number
}
```

### Match (js/models/Match.js)
```javascript
{
  team1Id: string,
  team2Id: string,
  score1: number | null,
  score2: number | null,
  isPlayed: boolean,
  type: 'pool' | 'knockout'
}
```

### Pool (js/models/Pool.js)
```javascript
{
  id: string,
  teams: string[],      // Array d'IDs d'équipes
  matches: Match[]
}
```
- Génère automatiquement les matches round-robin pour 4 équipes
- Pour les poules de 5, seules les 4 premières jouent entre elles
- La 5ème équipe joue des matches inter-poules

### Bracket (js/models/Bracket.js)
```javascript
{
  teams: string[],      // 4, 8, 16 ou 32 équipes
  rounds: Match[][]     // Array de rounds
}
```
- Génère les rounds progressivement
- Supporte 4 équipes (2 rounds), 8 (3 rounds), 16 (4 rounds), 32 (5 rounds)

### Tournament (js/models/Tournament.js)
Classe principale orchestrant tout le tournoi.

```javascript
{
  name: string,
  teams: Map<string, Team>,
  pools: Pool[],
  bracket: Bracket | null,
  phase: 'setup' | 'pool' | 'bracket' | 'finished',
  qualifiedCount: 8 | 16 | 32,
  nextTeamId: number
}
```

## 🔄 Flux de données

### Création d'un tournoi
```
SetupView.handleCreateSubmit()
  → new Tournament(name, qualifiedCount)
  → app.setTournament(tournament)
  → StorageManager.saveTournament()
```

### Ajout d'une équipe
```
SetupView.handleAddTeam()
  → tournament.addTeam(name)
  → tournament.save()
  → refreshView()
```

### Choix du nombre de poules (Nouveau flux)
```
SetupView.goToPoolCount()
  → renderPoolCount()
    → calculateDistribution(teamCount, poolCount) pour chaque option
  → selectPoolCount(count)
  → goToFormat()
    → renderFormat() avec getQualificationDescription(poolCount, qualifiedCount)
```

### Phase de poules
```
SetupView.startTournament()
  → tournament.createPools(poolSizes)
    → pools[].generateMatches()
    → tournament.generateInterPoolMatches()
  → tournament.phase = 'pool'
  → tournament.save()
  → router.navigate('pool-phase')
```

### Saisie de score
```
PoolPhaseView.saveScore()
  → match.setScore(score1, score2)
  → tournament.updateTeamStats(match)
  → tournament.save()
  → rerender()
```

### Qualification et bracket
```
PoolPhaseView.startBracketPhase()
  → tournament.getQualifiedTeams()
  → tournament.startBracketPhase()
    → new Bracket(qualifiedTeams)
    → bracket.initializeBracket()
  → tournament.phase = 'bracket'
  → router.navigate('bracket')
```

## 🎨 Composants et patterns

### Création de boutons
```javascript
createPrimaryButton('Texte', 'action()')
createSecondaryButton('Texte', 'action()')
createDangerButton('Texte', 'action()')
```
Génère : `<button type="button" class="btn-primary" data-action="action()">Texte</button>`

### Gestion des actions
- Les boutons ont un attribut `data-action` avec le code à exécuter
- Un handler global dans `app.js` intercepte les clics et exécute l'action
- Évite les inline onclick et permet un contrôle centralisé

### Pattern de view
```javascript
class MyView {
  constructor(tournament) {
    this.tournament = tournament;
    this.editingId = null; // État local de la vue
  }

  render() {
    return `<div>...</div>`;
  }

  attachEventListeners() {
    // Listeners spécifiques
  }

  rerender() {
    app.renderView(this); // Préserve l'état local
  }
}
```

## 🔒 Sécurité

### Prévention XSS
Toutes les chaînes affichées passent par `escapeHtml()` :
```javascript
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

### Validation des données
- Vérification des scores (>= 0, pas d'égalité en knockout)
- Validation du nombre d'équipes (pair, minimum selon format)
- Vérification de l'existence des équipes avant les opérations

## 💾 Persistence

### LocalStorage
- Clé unique : `'coinche_tournament'`
- Sérialisation : `JSON.stringify(tournament.toJSON())`
- Désérialisation : `Tournament.fromJSON(JSON.parse(data))`

### Export/Import
- Export : génère un fichier JSON téléchargeable
- Import : lit un fichier JSON et restaure l'état complet
- Format identique au localStorage pour compatibilité

## 🧮 Algorithmes clés

### Génération des matches de poule (Pool.js)
Organisation par rounds pour éviter que les équipes attendent :
```javascript
const rounds = [
  [[0, 1], [2, 3]], // Round 1
  [[0, 2], [1, 3]], // Round 2
  [[0, 3], [1, 2]]  // Round 3
];
```

### Matches inter-poules (Tournament.js)
Pour chaque paire de poules de 5 :
- 3 matches en rotation : 5ème vs 5ème, 4ème vs 4ème, 3ème vs 3ème
- Répartis entre les deux poules (2 dans l'une, 1 dans l'autre)

### Classement (Pool.js getRanking())
```javascript
ranking.sort((a, b) => {
  if (b.matchesWon !== a.matchesWon) 
    return b.matchesWon - a.matchesWon;
  
  const gaA = a.pointsScored - a.pointsConceded;
  const gaB = b.pointsScored - b.pointsConceded;
  if (gaB !== gaA) 
    return gaB - gaA;
  
  return b.pointsScored - a.pointsScored;
});
```

### Qualification (Tournament.js getQualifiedTeams())
1. Tous les 1ers de poule
2. Meilleurs 2èmes (triés par critères de classement)
3. Si nécessaire, meilleurs 3èmes
4. Tri final de tous les qualifiés pour les têtes de série

### Génération du bracket (Bracket.js)
```javascript
generateRound(teams) {
  const halfLength = Math.floor(teams.length / 2);
  for (let i = 0; i < halfLength; i++) {
    // Meilleur contre plus mauvais
    match(teams[i], teams[teams.length - 1 - i]);
  }
}
```

## 🎯 Points d'entrée pour modifications

### Ajouter un nouveau format de tournoi
1. Modifier `SetupView.renderFormat()` : ajouter l'option
2. Modifier `Bracket.js` : supporter le nouveau nombre d'équipes
3. Adapter `getRoundName()` pour les nouveaux rounds

### Modifier le choix du nombre de poules
1. `SetupView.calculateDistribution(teamCount, poolCount)` : logique de validation
2. `SetupView.getMinPoolsForQualified(qualifiedCount)` : contraintes minimales
3. `SetupView.calculatePoolSizesForCount(teamCount, poolCount)` : génération des tailles
4. `SetupView.getQualificationDescription(poolCount, qualifiedCount)` : description des règles

### Changer les critères de classement
Modifier `Pool.getRanking()` et `Tournament.getQualifiedTeams()`

### Ajouter une nouvelle vue
1. Créer `js/views/MaVue.js` avec les méthodes `render()` et `attachEventListeners()`
2. Ajouter la route dans `app.js` : `router.register('ma-route', () => this.renderMaVue())`
3. Ajouter `renderMaVue()` dans App
4. Ajouter le lien dans la navigation

### Modifier le style
Tout le CSS est dans `css/style.css`, organisé par composants

## 🐛 Debugging

### Console logs
- Les actions de boutons sont loggées : `Action clicked: ...`
- Activer les logs dans les models pour tracer les opérations

### Inspection du tournoi
Dans la console :
```javascript
app.tournament                    // État actuel
app.tournament.toJSON()           // Vue sérialisée
localStorage.getItem('coinche_tournament') // Données brutes
```

### Réinitialisation
```javascript
localStorage.removeItem('coinche_tournament')
location.reload()
```

## 🔧 Conventions de code

- **Nommage** : camelCase pour variables/fonctions, PascalCase pour classes
- **Indentation** : 4 espaces (ou 2 selon préférence, être cohérent)
- **Commentaires** : JSDoc pour les méthodes publiques
- **Retours à la ligne** : 80-100 caractères recommandés
- **Strings** : simple quotes `'...'` sauf pour templates `` `...` ``

## 📊 Complexité

- **Génération des matches** : O(n²) où n = nombre d'équipes par poule (max 5)
- **Classement** : O(n log n) où n = nombre d'équipes dans la poule
- **Qualification** : O(p log p) où p = nombre de poules
- **Bracket** : O(1) pour la génération de chaque round

## 🚀 Améliorations récentes

- [x] **Choix du nombre de poules** : l'utilisateur peut choisir librement le nombre de poules
- [x] **Flux réorganisé** : Teams → Pool Count → Format → Pools (ordre logique)
- [x] **Interface améliorée** : page d'organisation des poules avec stats visuelles
- [x] **Descriptions dynamiques** : qualification adaptée au nombre de poules choisi

## 🚀 Améliorations possibles

- [ ] Mode multi-tournois (plusieurs tournois en parallèle)
- [ ] Statistiques avancées (historique des confrontations)
- [ ] Mode hors-ligne complet (Service Worker)
- [ ] Synchronisation multi-device
- [ ] Interface d'administration des équipes
- [ ] Gestion des matchs nuls en poule
- [ ] Petite finale (match pour la 3ème place)
- [ ] Historique des modifications avec undo/redo
- [ ] Thèmes personnalisables

## 📚 Ressources

- [MDN Web Docs](https://developer.mozilla.org/) : référence JavaScript
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Hash-based routing](https://developer.mozilla.org/en-US/docs/Web/API/Location/hash)

---

Cette application a été développée avec Claude Code pour démontrer qu'on peut créer une application web complète et robuste en vanilla JavaScript sans framework.
