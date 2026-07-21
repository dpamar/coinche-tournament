/**
 * StorageManager - Gestionnaire de stockage local pour les tournois de coinche
 * Gère la sauvegarde, le chargement et la suppression des données de tournoi dans localStorage
 */
const StorageManager = {
  // Clés utilisées dans localStorage
  STORAGE_KEY: 'coinche_tournament',
  TIMESTAMP_KEY: 'coinche_tournament_timestamp',

  /**
   * Sauvegarde un tournoi dans localStorage
   * @param {Object} tournament - L'objet tournoi à sauvegarder
   * @returns {boolean} - true si la sauvegarde a réussi, false sinon
   */
  saveTournament(tournament) {
    try {
      // Sérialisation en JSON
      const tournamentJSON = JSON.stringify(tournament);

      // Sauvegarde dans localStorage
      localStorage.setItem(this.STORAGE_KEY, tournamentJSON);

      // Sauvegarde du timestamp de modification
      const timestamp = Date.now();
      localStorage.setItem(this.TIMESTAMP_KEY, timestamp.toString());

      console.log('Tournament saved successfully at', new Date(timestamp).toISOString());
      return true;
    } catch (error) {
      // Gestion d'erreur silencieuse
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded. Unable to save tournament:', error);
      } else {
        console.error('Error saving tournament to localStorage:', error);
      }
      return false;
    }
  },

  /**
   * Charge un tournoi depuis localStorage
   * @returns {Object|null} - L'objet tournoi brut (JSON) ou null si aucun tournoi n'existe
   */
  loadTournament() {
    try {
      // Récupération depuis localStorage
      const tournamentJSON = localStorage.getItem(this.STORAGE_KEY);

      // Si aucun tournoi n'existe
      if (!tournamentJSON) {
        console.log('No tournament found in localStorage');
        return null;
      }

      // Parsing du JSON
      const tournament = JSON.parse(tournamentJSON);
      console.log('Tournament loaded successfully');
      return tournament;
    } catch (error) {
      // Gestion d'erreur silencieuse
      console.error('Error loading tournament from localStorage:', error);
      return null;
    }
  },

  /**
   * Supprime le tournoi du localStorage
   * @returns {boolean} - true si la suppression a réussi, false sinon
   */
  deleteTournament() {
    try {
      // Suppression du tournoi et du timestamp
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TIMESTAMP_KEY);

      console.log('Tournament deleted successfully');
      return true;
    } catch (error) {
      // Gestion d'erreur silencieuse
      console.error('Error deleting tournament from localStorage:', error);
      return false;
    }
  },

  /**
   * Récupère le timestamp de dernière modification
   * @returns {number|null} - Le timestamp (en millisecondes) ou null si non disponible
   */
  getLastModified() {
    try {
      const timestamp = localStorage.getItem(this.TIMESTAMP_KEY);

      if (!timestamp) {
        return null;
      }

      return parseInt(timestamp, 10);
    } catch (error) {
      // Gestion d'erreur silencieuse
      console.error('Error getting last modified timestamp:', error);
      return null;
    }
  },

  /**
   * Vérifie si un tournoi actif existe en localStorage
   * @returns {boolean} - true si un tournoi existe, false sinon
   */
  hasActiveTournament() {
    try {
      const tournamentJSON = localStorage.getItem(this.STORAGE_KEY);
      return tournamentJSON !== null && tournamentJSON !== undefined;
    } catch (error) {
      // Gestion d'erreur silencieuse
      console.error('Error checking for active tournament:', error);
      return false;
    }
  }
};
