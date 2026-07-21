/**
 * Classe Tournament représentant le tournoi complet
 */
class Tournament {
  constructor(name, qualifiedCount = 16) {
    this.name = name;
    this.teams = new Map(); // Map<id, Team>
    this.pools = []; // Array de Pool
    this.bracket = null; // Bracket
    this.phase = 'setup'; // 'setup', 'pool', 'bracket', 'finished'
    this.nextTeamId = 1;
    this.qualifiedCount = qualifiedCount; // Nombre d'équipes qualifiées pour la phase finale (8, 16, ou 32)
  }

  /**
   * Ajoute une équipe au tournoi
   * @param {string} name - Nom de l'équipe
   * @returns {Team} L'équipe créée
   */
  addTeam(name) {
    const id = 'team_' + this.nextTeamId++;
    const team = new Team(name, id);
    this.teams.set(id, team);
    return team;
  }

  /**
   * Crée les poules avec les tailles données
   * @param {Array<number>} poolSizes - Array des tailles de poules (ex: [4, 4, 5, 5])
   */
  createPools(poolSizes) {
    if (this.phase !== 'setup') {
      throw new Error('Les poules ne peuvent être créées qu\'en phase setup');
    }

    const totalTeams = poolSizes.reduce((sum, size) => sum + size, 0);
    if (totalTeams !== this.teams.size) {
      throw new Error(`Le nombre d'équipes ne correspond pas (${this.teams.size} équipes, ${totalTeams} places)`);
    }

    // Vérifier que le nombre de poules de 5 est pair
    const poolsOfFive = poolSizes.filter(size => size === 5).length;
    if (poolsOfFive % 2 !== 0) {
      throw new Error(`Le nombre de poules de 5 équipes doit être pair (actuellement: ${poolsOfFive})`);
    }

    // Convertir les équipes en array pour les distribuer
    const teamIds = Array.from(this.teams.keys());
    let teamIndex = 0;

    this.pools = [];
    poolSizes.forEach((size, index) => {
      const poolTeams = teamIds.slice(teamIndex, teamIndex + size);
      const pool = new Pool('pool_' + (index + 1), poolTeams);
      pool.generateMatches();
      this.pools.push(pool);
      teamIndex += size;
    });

    // Générer les matches inter-poules pour les poules de 5
    this.generateInterPoolMatches();

    this.phase = 'pool';
  }

  /**
   * Génère les matches inter-poules entre les 5èmes équipes des poules de 5
   *
   * Logique :
   * - Identifier toutes les poules de 5 équipes
   * - Les apparier deux par deux
   * - Pour chaque paire de poules, générer 3 matches entre leurs 5èmes équipes
   * - Répartir équitablement les matches entre les deux poules (2 dans l'une, 1 dans l'autre)
   *
   * Exemple : Si Poule A et Poule B ont chacune 5 équipes
   *   - 2 matches sont ajoutés à Poule A
   *   - 1 match est ajouté à Poule B
   *   => Total : 3 matches entre les 5èmes équipes
   */
  generateInterPoolMatches() {
    // Identifier les poules de 5 équipes
    const poolsOfFive = this.pools.filter(pool => pool.teams.length === 5);

    if (poolsOfFive.length === 0) {
      return; // Pas de poules de 5, rien à faire
    }

    if (poolsOfFive.length % 2 !== 0) {
      throw new Error('Le nombre de poules de 5 doit être pair pour les matches inter-poules');
    }

    // Apparier les poules de 5 deux par deux
    for (let i = 0; i < poolsOfFive.length; i += 2) {
      const poolA = poolsOfFive[i];
      const poolB = poolsOfFive[i + 1];

      // Générer 3 matches inter-poules en faisant tourner les équipes
      // Match 1 : 5ème vs 5ème (indices 4 et 4)
      // Match 2 : 4ème vs 4ème (indices 3 et 3)
      // Match 3 : 3ème vs 3ème (indices 2 et 2)
      for (let matchNum = 0; matchNum < 3; matchNum++) {
        const teamIndexA = 4 - matchNum; // 4, 3, 2 (5ème, 4ème, 3ème équipe)
        const teamIndexB = 4 - matchNum;

        const teamA = poolA.teams[teamIndexA];
        const teamB = poolB.teams[teamIndexB];

        const match = new Match(teamA, teamB, 'pool');

        // Répartir les matches entre les deux poules : 2 dans poolA, 1 dans poolB
        if (matchNum < 2) {
          poolA.addInterPoolMatch(match);
        } else {
          poolB.addInterPoolMatch(match);
        }
      }
    }
  }

  /**
   * Retourne les 16 meilleures équipes qualifiées pour la phase éliminatoire
   *
   * Règles de qualification :
   *   1) Tous les 1ers de chaque poule sont qualifiés
   *   2) On complète avec les meilleurs 2èmes (triés selon critères de classement)
   *   3) Si nécessaire, on complète avec les meilleurs 3èmes
   *   4) Objectif : exactement 16 équipes qualifiées
   *
   * Critères de tri pour départager les 2èmes et 3èmes entre eux :
   *   - Nombre de victoires (décroissant)
   *   - Goal average (décroissant)
   *   - Points marqués (décroissant)
   *
   * @returns {Array<string>} Array de 16 IDs d'équipes qualifiées, triés par performance globale
   */
  getQualifiedTeams() {
    if (this.pools.length === 0) {
      return [];
    }

    const TARGET_QUALIFIED = this.qualifiedCount || 16;
    const firstPlaces = [];
    const secondPlaces = [];
    const thirdPlaces = [];

    // Étape 1 : Récupérer les classements de chaque poule
    this.pools.forEach(pool => {
      const ranking = pool.getRanking(this.teams);
      if (ranking.length >= 1) firstPlaces.push(ranking[0]);
      if (ranking.length >= 2) secondPlaces.push(ranking[1]);
      if (ranking.length >= 3) thirdPlaces.push(ranking[2]);
    });

    // Fonction de comparaison pour trier les équipes selon les critères
    const compareTeams = (a, b) => {
      // Critère 1 : Nombre de victoires
      if (b.matchesWon !== a.matchesWon) {
        return b.matchesWon - a.matchesWon;
      }
      // Critère 2 : Goal average
      const goalAverageA = a.pointsScored - a.pointsConceded;
      const goalAverageB = b.pointsScored - b.pointsConceded;
      if (goalAverageB !== goalAverageA) {
        return goalAverageB - goalAverageA;
      }
      // Critère 3 : Points marqués
      return b.pointsScored - a.pointsScored;
    };

    // Étape 2 : Trier les 2èmes et 3èmes pour identifier les meilleurs
    secondPlaces.sort(compareTeams);
    thirdPlaces.sort(compareTeams);

    // Étape 3 : Construire la liste des qualifiés
    const qualified = [...firstPlaces]; // Commencer par tous les 1ers

    // Compléter avec les meilleurs 2èmes
    let remaining = TARGET_QUALIFIED - qualified.length;
    if (remaining > 0 && secondPlaces.length > 0) {
      const secondsToAdd = Math.min(remaining, secondPlaces.length);
      qualified.push(...secondPlaces.slice(0, secondsToAdd));
      remaining -= secondsToAdd;
    }

    // Si nécessaire, compléter avec les meilleurs 3èmes
    if (remaining > 0 && thirdPlaces.length > 0) {
      const thirdsToAdd = Math.min(remaining, thirdPlaces.length);
      qualified.push(...thirdPlaces.slice(0, thirdsToAdd));
    }

    // Étape 4 : Trier tous les qualifiés par performance globale
    // Cela détermine les têtes de série pour le bracket
    qualified.sort(compareTeams);

    // Retourner exactement 16 IDs (ou moins si pas assez d'équipes)
    return qualified.slice(0, TARGET_QUALIFIED).map(team => team.id);
  }

  /**
   * Démarre la phase éliminatoire avec les équipes qualifiées
   * @returns {boolean} True si la phase a démarré, false sinon
   */
  startBracketPhase() {
    if (this.phase !== 'pool') {
      return false;
    }

    if (!this.isPoolPhaseReady()) {
      return false;
    }

    const qualifiedTeams = this.getQualifiedTeams();
    const expected = this.qualifiedCount || 16;
    if (qualifiedTeams.length !== expected) {
      throw new Error(`Exactement ${expected} équipes doivent être qualifiées (actuellement: ${qualifiedTeams.length})`);
    }

    this.bracket = new Bracket(qualifiedTeams);
    this.bracket.initializeBracket();
    this.phase = 'bracket';
    return true;
  }

  /**
   * Vérifie si la phase de poules est terminée (tous les matches joués)
   * @returns {boolean} True si tous les matches de poule sont joués
   */
  isPoolPhaseReady() {
    if (this.pools.length === 0) {
      return false;
    }

    return this.pools.every(pool =>
      pool.matches.every(match => match.isPlayed)
    );
  }

  /**
   * Vérifie si un round du bracket est terminé
   * @param {number} roundIndex - Index du round à vérifier
   * @returns {boolean} True si tous les matches du round sont joués
   */
  isBracketRoundReady(roundIndex) {
    if (!this.bracket || roundIndex >= this.bracket.rounds.length) {
      return false;
    }

    const round = this.bracket.rounds[roundIndex];
    return round.every(match => match.isPlayed);
  }

  /**
   * Vérifie si la phase éliminatoire est terminée
   * @returns {boolean} True si le tournoi est terminé
   */
  isBracketPhaseReady() {
    if (!this.bracket || this.bracket.rounds.length === 0) {
      return false;
    }

    // Vérifier si la finale (dernier round) est jouée
    const finale = this.bracket.rounds[this.bracket.rounds.length - 1];
    return finale.length > 0 && finale[0].isPlayed;
  }

  /**
   * Met à jour les statistiques des équipes après un match
   * @param {Match} match - Le match joué
   */
  updateTeamStats(match) {
    if (!match.isPlayed) {
      return;
    }

    const team1 = this.teams.get(match.team1Id);
    const team2 = this.teams.get(match.team2Id);

    if (team1) {
      team1.matchesPlayed++;
      team1.pointsScored += match.score1;
      team1.pointsConceded += match.score2;
      if (match.score1 > match.score2) {
        team1.matchesWon++;
      }
    }

    if (team2) {
      team2.matchesPlayed++;
      team2.pointsScored += match.score2;
      team2.pointsConceded += match.score1;
      if (match.score2 > match.score1) {
        team2.matchesWon++;
      }
    }
  }

  /**
   * Convertit le tournoi en objet JSON
   * @returns {object} Représentation JSON du tournoi
   */
  toJSON() {
    const teamsArray = Array.from(this.teams.values()).map(team => team.toJSON());

    return {
      name: this.name,
      teams: teamsArray,
      pools: this.pools.map(pool => pool.toJSON()),
      bracket: this.bracket ? this.bracket.toJSON() : null,
      phase: this.phase,
      nextTeamId: this.nextTeamId,
      qualifiedCount: this.qualifiedCount || 16
    };
  }

  /**
   * Crée une instance de Tournament à partir d'un objet JSON
   * @param {object} json - Objet JSON contenant les données du tournoi
   * @returns {Tournament} Instance de Tournament
   */
  static fromJSON(json) {
    const tournament = new Tournament(json.name);

    // Restaurer les équipes
    tournament.teams = new Map();
    if (json.teams) {
      json.teams.forEach(teamData => {
        const team = Team.fromJSON(teamData);
        tournament.teams.set(team.id, team);
      });
    }

    // Restaurer les poules
    tournament.pools = json.pools ? json.pools.map(poolData => Pool.fromJSON(poolData)) : [];

    // Restaurer le bracket
    tournament.bracket = json.bracket ? Bracket.fromJSON(json.bracket) : null;

    tournament.phase = json.phase || 'setup';
    tournament.nextTeamId = json.nextTeamId || 1;
    tournament.qualifiedCount = json.qualifiedCount || 16;

    return tournament;
  }

  /**
   * Sauvegarde le tournoi dans le localStorage
   */
  save() {
    localStorage.setItem('coinche_tournament', JSON.stringify(this.toJSON()));
  }

  /**
   * Charge le tournoi depuis le localStorage
   * @returns {Tournament|null} Instance de Tournament ou null si pas de sauvegarde
   */
  static load() {
    const data = localStorage.getItem('coinche_tournament');
    if (!data) {
      return null;
    }
    try {
      return Tournament.fromJSON(JSON.parse(data));
    } catch (error) {
      console.error('Erreur lors du chargement du tournoi:', error);
      return null;
    }
  }
}
