/**
 * Classe Pool représentant une poule de 4 ou 5 équipes
 */
class Pool {
  constructor(id, teams) {
    this.id = id;
    this.teams = teams; // Array d'objets Team ou d'IDs
    this.matches = [];
  }

  /**
   * Génère tous les matches internes de la poule (round-robin)
   * Pour 4 équipes : 6 matches (round-robin complet : chaque équipe joue contre chacun)
   * Pour 5 équipes : 6 matches internes (round-robin sur les 4 premières équipes)
   *   La 5ème équipe (index 4) joue uniquement des matches inter-poules,
   *   qui sont générés au niveau Tournament via generateInterPoolMatches()
   */
  generateMatches() {
    this.matches = [];
    const teamCount = this.teams.length;

    // Poule de 4 : round-robin complet avec ordre optimal
    // Round 1 : 1-2, 3-4
    // Round 2 : 1-3, 2-4
    // Round 3 : 1-4, 2-3
    if (teamCount === 4) {
      const rounds = [
        [[0, 1], [2, 3]], // Round 1 : 1-2, 3-4
        [[0, 2], [1, 3]], // Round 2 : 1-3, 2-4
        [[0, 3], [1, 2]]  // Round 3 : 1-4, 2-3
      ];

      for (const round of rounds) {
        for (const [i, j] of round) {
          const match = new Match(this.teams[i], this.teams[j], 'pool');
          this.matches.push(match);
        }
      }
    }
    // Poule de 5 : round-robin sur les 4 premières équipes uniquement
    // La 5ème équipe jouera des matches inter-poules
    // Même organisation en rounds pour les 4 premières
    else if (teamCount === 5) {
      const rounds = [
        [[0, 1], [2, 3]], // Round 1 : 1-2, 3-4
        [[0, 2], [1, 3]], // Round 2 : 1-3, 2-4
        [[0, 3], [1, 2]]  // Round 3 : 1-4, 2-3
      ];

      for (const round of rounds) {
        for (const [i, j] of round) {
          const match = new Match(this.teams[i], this.teams[j], 'pool');
          this.matches.push(match);
        }
      }
    }
    // Sécurité : lever une erreur pour toute autre taille
    else {
      throw new Error(`Taille de poule invalide: ${teamCount}. Seules les poules de 4 ou 5 équipes sont supportées.`);
    }
  }

  /**
   * Ajoute un match inter-poules impliquant la 5ème équipe de cette poule
   * Cette méthode est appelée par Tournament.generateInterPoolMatches()
   * @param {Match} match - Le match inter-poules à ajouter
   */
  addInterPoolMatch(match) {
    if (this.teams.length !== 5) {
      throw new Error('Seules les poules de 5 équipes peuvent avoir des matches inter-poules');
    }

    // Vérifier que le match implique bien une équipe de cette poule
    const hasTeam = this.teams.includes(match.team1Id) || this.teams.includes(match.team2Id);
    if (!hasTeam) {
      throw new Error('Le match inter-poules doit impliquer au moins une équipe de cette poule');
    }

    this.matches.push(match);
  }

  /**
   * Retourne la 5ème équipe de la poule (pour les matches inter-poules)
   * @returns {string|null} ID de la 5ème équipe, ou null si la poule n'a pas 5 équipes
   */
  getFifthTeam() {
    return this.teams.length === 5 ? this.teams[4] : null;
  }

  /**
   * Retourne le classement trié des équipes de la poule
   * Critères de départage (dans l'ordre) :
   *   1) Nombre de victoires (décroissant)
   *   2) Goal average = points marqués - points encaissés (décroissant)
   *   3) Points marqués (décroissant)
   *
   * @param {Map<string, Team>} teamsMap - Map des équipes par ID
   * @returns {Array<object>} Classement avec statistiques complètes
   *   Chaque objet contient : id, name, matchesPlayed, matchesWon, pointsScored, pointsConceded
   */
  getRanking(teamsMap) {
    // Initialiser les statistiques pour chaque équipe de la poule
    const stats = {};

    this.teams.forEach(teamId => {
      const team = teamsMap.get(teamId);
      stats[teamId] = {
        id: teamId,
        name: team ? team.name : 'Équipe ' + teamId,
        matchesPlayed: 0,
        matchesWon: 0,
        pointsScored: 0,
        pointsConceded: 0
      };
    });

    // Calculer les statistiques en parcourant tous les matches de la poule
    this.matches.forEach(match => {
      if (match.isPlayed) {
        // Statistiques pour l'équipe 1 (seulement si elle est dans cette poule)
        if (stats[match.team1Id]) {
          stats[match.team1Id].matchesPlayed++;
          stats[match.team1Id].pointsScored += match.score1;
          stats[match.team1Id].pointsConceded += match.score2;
          if (match.score1 > match.score2) {
            stats[match.team1Id].matchesWon++;
          }
        }

        // Statistiques pour l'équipe 2 (seulement si elle est dans cette poule)
        if (stats[match.team2Id]) {
          stats[match.team2Id].matchesPlayed++;
          stats[match.team2Id].pointsScored += match.score2;
          stats[match.team2Id].pointsConceded += match.score1;
          if (match.score2 > match.score1) {
            stats[match.team2Id].matchesWon++;
          }
        }
      }
    });

    // Convertir en tableau et appliquer les critères de classement
    const ranking = Object.values(stats);
    ranking.sort((a, b) => {
      // Critère 1 : Nombre de victoires (le plus de victoires en premier)
      if (b.matchesWon !== a.matchesWon) {
        return b.matchesWon - a.matchesWon;
      }

      // Critère 2 : Goal average (différence points marqués - points encaissés)
      const goalAverageA = a.pointsScored - a.pointsConceded;
      const goalAverageB = b.pointsScored - b.pointsConceded;
      if (goalAverageB !== goalAverageA) {
        return goalAverageB - goalAverageA;
      }

      // Critère 3 : Points marqués (le plus de points en premier)
      return b.pointsScored - a.pointsScored;
    });

    return ranking;
  }

  /**
   * Convertit la poule en objet JSON
   * @returns {object} Représentation JSON de la poule
   */
  toJSON() {
    return {
      id: this.id,
      teams: this.teams,
      matches: this.matches.map(m => m.toJSON())
    };
  }

  /**
   * Crée une instance de Pool à partir d'un objet JSON
   * @param {object} json - Objet JSON contenant les données de la poule
   * @returns {Pool} Instance de Pool
   */
  static fromJSON(json) {
    const pool = new Pool(json.id, json.teams);
    pool.matches = json.matches ? json.matches.map(m => Match.fromJSON(m)) : [];
    return pool;
  }
}
