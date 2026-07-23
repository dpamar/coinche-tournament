/**
 * Classe Team représentant une équipe dans le tournoi de coinche
 */
class Team {
  /**
   * Crée une nouvelle équipe
   * @param {string} name - Nom de l'équipe
   * @param {string} id - Identifiant unique de l'équipe
   */
  constructor(name, id) {
    this.id = id;
    this.name = name;
    this.matchesPlayed = 0;
    this.matchesWon = 0;
    this.pointsScored = 0;
    this.pointsConceded = 0;
  }

  /**
   * Calcule et retourne le goal average (différence de points)
   * @returns {number} Goal average (pointsScored - pointsConceded)
   */
  getGoalAverage() {
    return this.pointsScored - this.pointsConceded;
  }

  /**
   * Convertit l'équipe en objet JSON
   * @returns {object} Représentation JSON de l'équipe
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      matchesPlayed: this.matchesPlayed,
      matchesWon: this.matchesWon,
      pointsScored: this.pointsScored,
      pointsConceded: this.pointsConceded
    };
  }

  /**
   * Crée une instance de Team à partir d'un objet JSON
   * @param {object} json - Objet JSON contenant les données de l'équipe
   * @returns {Team} Instance de Team
   */
  static fromJSON(json) {
    const team = new Team(json.name, json.id);
    team.matchesPlayed = json.matchesPlayed || 0;
    team.matchesWon = json.matchesWon || 0;
    team.pointsScored = json.pointsScored || 0;
    team.pointsConceded = json.pointsConceded || 0;
    return team;
  }
}
