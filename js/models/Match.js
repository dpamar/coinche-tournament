/**
 * Classe Match représentant un match entre deux équipes
 */
class Match {
  /**
   * Crée un nouveau match
   * @param {string|object} team1 - ID de l'équipe 1 ou objet Team
   * @param {string|object} team2 - ID de l'équipe 2 ou objet Team
   * @param {string} type - Type de match ('pool' ou 'knockout')
   */
  constructor(team1, team2, type) {
    this.team1Id = typeof team1 === 'object' ? team1.id : team1;
    this.team2Id = typeof team2 === 'object' ? team2.id : team2;
    this.type = type; // 'pool' ou 'knockout'
    this.score1 = null;
    this.score2 = null;
    this.isPlayed = false;
  }

  /**
   * Enregistre les scores du match
   * @param {number} score1 - Score de l'équipe 1
   * @param {number} score2 - Score de l'équipe 2
   */
  setScore(score1, score2) {
    this.score1 = parseInt(score1);
    this.score2 = parseInt(score2);
    this.isPlayed = true;
  }

  /**
   * Retourne l'ID de l'équipe gagnante
   * @returns {string|null} ID de l'équipe gagnante ou null si match non joué ou égalité
   */
  getWinner() {
    if (!this.isPlayed) {
      return null;
    }
    if (this.score1 > this.score2) {
      return this.team1Id;
    } else if (this.score2 > this.score1) {
      return this.team2Id;
    }
    return null; // Égalité
  }

  /**
   * Convertit le match en objet JSON
   * @returns {object} Représentation JSON du match
   */
  toJSON() {
    return {
      team1Id: this.team1Id,
      team2Id: this.team2Id,
      type: this.type,
      score1: this.score1,
      score2: this.score2,
      isPlayed: this.isPlayed
    };
  }

  /**
   * Crée une instance de Match à partir d'un objet JSON
   * @param {object} json - Objet JSON contenant les données du match
   * @returns {Match} Instance de Match
   */
  static fromJSON(json) {
    const match = new Match(json.team1Id, json.team2Id, json.type);
    match.score1 = json.score1;
    match.score2 = json.score2;
    match.isPlayed = json.isPlayed || false;
    return match;
  }
}
