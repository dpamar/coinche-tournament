/**
 * Classe Bracket représentant le tableau éliminatoire (4, 8, 16 ou 32 équipes)
 */
class Bracket {
  constructor(teams) {
    this.teams = teams; // Array d'IDs d'équipes (4, 8, 16, ou 32)
    this.rounds = []; // Array de rounds, chaque round contient des matches
    // Pour 4 équipes  : rounds[0] = 1/2, rounds[1] = finale
    // Pour 8 équipes  : rounds[0] = 1/4, rounds[1] = 1/2, rounds[2] = finale
    // Pour 16 équipes : rounds[0] = 1/8, rounds[1] = 1/4, rounds[2] = 1/2, rounds[3] = finale
    // Pour 32 équipes : rounds[0] = 1/16, rounds[1] = 1/8, rounds[2] = 1/4, rounds[3] = 1/2, rounds[4] = finale
  }

  /**
   * Génère un round avec les équipes données
   * Meilleur contre plus mauvais (1 vs 16, 2 vs 15, etc.)
   * @param {Array<string>} teams - Array d'IDs d'équipes
   * @returns {Array<Match>} Array de matches
   */
  generateRound(teams) {
    const matches = [];
    const halfLength = Math.floor(teams.length / 2);

    for (let i = 0; i < halfLength; i++) {
      const match = new Match(teams[i], teams[teams.length - 1 - i], 'knockout');
      matches.push(match);
    }

    return matches;
  }

  /**
   * Initialise le bracket avec les équipes qualifiées (4, 8, 16 ou 32)
   * Génère le premier round
   */
  initializeBracket() {
    const validCounts = [4, 8, 16, 32];
    if (!validCounts.includes(this.teams.length)) {
      throw new Error(`Le bracket nécessite 4, 8, 16 ou 32 équipes (actuellement: ${this.teams.length})`);
    }

    // Générer le premier round
    this.rounds = [];
    this.rounds[0] = this.generateRound(this.teams);
  }

  /**
   * Fait passer les gagnants d'un round au round suivant
   * @param {number} roundIndex - Index du round (0 = 1/8, 1 = 1/4, 2 = 1/2, 3 = finale)
   * @returns {boolean} True si le round suivant a été créé, false sinon
   */
  advanceWinners(roundIndex) {
    if (roundIndex < 0 || roundIndex >= this.rounds.length) {
      return false;
    }

    const currentRound = this.rounds[roundIndex];
    const winners = [];

    // Vérifier que tous les matches du round sont joués
    for (let match of currentRound) {
      if (!match.isPlayed) {
        return false; // Tous les matches doivent être joués
      }
      const winner = match.getWinner();
      if (winner) {
        winners.push(winner);
      }
    }

    // Si on a des gagnants et qu'il y a plus d'un gagnant (pas encore la fin)
    if (winners.length > 1) {
      this.rounds[roundIndex + 1] = this.generateRound(winners);
      return true;
    } else if (winners.length === 1) {
      // Un seul gagnant = champion du tournoi
      return false;
    }

    return false;
  }

  /**
   * Retourne le champion du tournoi (si la finale est jouée)
   * @returns {string|null} ID de l'équipe championne ou null
   */
  getChampion() {
    // Vérifier qu'on a tous les rounds attendus
    // 4 équipes = 2 rounds, 8 équipes = 3 rounds, 16 = 4 rounds, 32 = 5 rounds
    const expectedRounds = Math.log2(this.teams.length);

    if (this.rounds.length < expectedRounds) {
      return null; // Pas encore tous les rounds créés
    }

    // Vérifier que la finale (dernier round) est jouée
    const finale = this.rounds[this.rounds.length - 1];
    if (finale.length === 0 || !finale[0].isPlayed) {
      return null;
    }

    return finale[0].getWinner();
  }

  /**
   * Retourne les noms des rounds en fonction du nombre d'équipes
   * @param {number} roundIndex - Index du round
   * @returns {string} Nom du round
   */
  getRoundName(roundIndex) {
    let names;

    // Déterminer les noms en fonction du nombre d'équipes initial
    if (this.teams.length === 4) {
      // 4 équipes : 2 rounds (4→2→1)
      names = ['Demi-finales', 'Finale'];
    } else if (this.teams.length === 8) {
      // 8 équipes : 3 rounds (8→4→2→1)
      names = ['Quarts de finale', 'Demi-finales', 'Finale'];
    } else if (this.teams.length === 16) {
      // 16 équipes : 4 rounds (16→8→4→2→1)
      names = ['Huitièmes de finale', 'Quarts de finale', 'Demi-finales', 'Finale'];
    } else if (this.teams.length === 32) {
      // 32 équipes : 5 rounds (32→16→8→4→2→1)
      names = ['Seizièmes de finale', 'Huitièmes de finale', 'Quarts de finale', 'Demi-finales', 'Finale'];
    } else {
      return 'Round ' + (roundIndex + 1);
    }

    return names[roundIndex] || 'Round ' + (roundIndex + 1);
  }

  /**
   * Convertit le bracket en objet JSON
   * @returns {object} Représentation JSON du bracket
   */
  toJSON() {
    return {
      teams: this.teams,
      rounds: this.rounds.map(round => round.map(match => match.toJSON()))
    };
  }

  /**
   * Crée une instance de Bracket à partir d'un objet JSON
   * @param {object} json - Objet JSON contenant les données du bracket
   * @returns {Bracket} Instance de Bracket
   */
  static fromJSON(json) {
    const bracket = new Bracket(json.teams || []);
    bracket.rounds = json.rounds ? json.rounds.map(round =>
      round.map(matchData => Match.fromJSON(matchData))
    ) : [];
    return bracket;
  }
}
