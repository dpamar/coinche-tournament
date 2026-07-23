/**
 * BracketView - Knockout phase management and visualization
 * Displays bracket rounds, handles score entry, shows champion when finished
 */
class BracketView {
    constructor(tournament) {
        this.tournament = tournament;
        this.editingMatchId = null;
    }

    render() {
        const bracket = this.tournament.bracket;

        if (!bracket || bracket.rounds.length === 0) {
            return `
                <div class="bracket-container">
                    <h2>Phase Éliminatoire</h2>
                    <p class="error-message">Le bracket n'a pas été initialisé correctement.</p>
                    ${createSecondaryButton('Retour à l\'accueil', 'router.navigate(\'home\')')}
                </div>
            `;
        }

        const champion = bracket.getChampion();
        const currentRoundIndex = this.getCurrentRoundIndex();
        const totalMatches = this.getTotalMatches();
        const playedMatches = this.getPlayedMatches();

        let html = `
            <div class="bracket-container">
                <div class="bracket-header">
                    <h2>Phase Éliminatoire</h2>
                    ${this.renderProgressInfo(currentRoundIndex, playedMatches, totalMatches)}
                </div>
        `;

        // Si le tournoi est terminé, afficher le champion
        if (champion) {
            html += this.renderChampionSection(champion);
        } else {
            // Afficher tous les rounds
            for (let i = 0; i < bracket.rounds.length; i++) {
                html += this.renderRound(i, bracket.rounds[i], currentRoundIndex);
            }
        }

        html += `
                <div class="bracket-actions">
                    ${createPrimaryButton('Feuille de Matches', 'goToMatchSheet()')}
                    ${createSecondaryButton('Exporter le Tournoi', 'exportTournament()')}
                    ${createSecondaryButton('Retour à l\'accueil', 'router.navigate(\'home\')')}
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Renders bracket phase progress information
     * @param {number} currentRoundIndex - Index of current round
     * @param {number} playedMatches - Number of matches played
     * @param {number} totalMatches - Total number of matches
     * @returns {string} HTML for progress section
     */
    renderProgressInfo(currentRoundIndex, playedMatches, totalMatches) {
        const roundName = currentRoundIndex < this.tournament.bracket.rounds.length
            ? this.tournament.bracket.getRoundName(currentRoundIndex)
            : 'Tournoi Terminé';

        return `
            <div class="bracket-progress">
                <div class="current-round">
                    <strong>Tour actuel :</strong> ${escapeHtml(roundName)}
                </div>
                <div class="progress-info">
                    <strong>Progression :</strong> ${playedMatches} matches joués sur ${totalMatches}
                </div>
            </div>
        `;
    }

    /**
     * Renders a bracket round with its matches
     * @param {number} roundIndex - Index of the round
     * @param {Array} round - Array of matches in the round
     * @param {number} currentRoundIndex - Index of current round
     * @returns {string} HTML for the round
     */
    renderRound(roundIndex, round, currentRoundIndex) {
        const roundName = this.tournament.bracket.getRoundName(roundIndex);
        const isCurrentRound = roundIndex === currentRoundIndex;
        const isCompletedRound = roundIndex < currentRoundIndex;
        const roundClass = isCurrentRound ? 'bracket-round current-round'
                         : isCompletedRound ? 'bracket-round completed-round'
                         : 'bracket-round';

        let html = `
            <div class="${roundClass}">
                <h3>${escapeHtml(roundName)}</h3>
                <div class="bracket-matches">
        `;

        round.forEach((match, matchIndex) => {
            html += this.renderMatch(match, roundIndex, matchIndex, isCompletedRound);
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    /**
     * Renders a bracket match with teams and scores
     * @param {Match} match - Match object
     * @param {number} roundIndex - Round index
     * @param {number} matchIndex - Match index in round
     * @param {boolean} isCompleted - Whether the round is completed
     * @returns {string} HTML for the match
     */
    renderMatch(match, roundIndex, matchIndex, isCompleted) {
        const team1 = this.tournament.teams.get(match.team1Id);
        const team2 = this.tournament.teams.get(match.team2Id);
        const matchId = `r${roundIndex}_m${matchIndex}`;

        if (!team1 || !team2) {
            return `
                <div class="bracket-match bracket-match-empty">
                    <div class="match-info">En attente des résultats précédents...</div>
                </div>
            `;
        }

        const winner = match.getWinner();
        const team1Class = winner === match.team1Id ? 'match-team winner' : 'match-team';
        const team2Class = winner === match.team2Id ? 'match-team winner' : 'match-team';
        const matchClass = match.isPlayed ? 'bracket-match match-played' : 'bracket-match match-pending';

        let html = `
            <div class="${matchClass}" id="match-${escapeHtml(matchId)}">
                <div class="match-teams">
                    <div class="${team1Class}">
                        <span class="team-name">${escapeHtml(team1.name)}</span>
                        ${match.isPlayed ? `<span class="team-score">${match.score1}</span>` : ''}
                    </div>
                    <div class="${team2Class}">
                        <span class="team-name">${escapeHtml(team2.name)}</span>
                        ${match.isPlayed ? `<span class="team-score">${match.score2}</span>` : ''}
                    </div>
                </div>
        `;

        // Formulaire de saisie de score ou boutons d'action
        if (this.editingMatchId === matchId) {
            html += this.renderScoreForm(matchId, roundIndex, matchIndex, match);
        } else {
            html += `
                <div class="match-actions">
            `;

            if (match.isPlayed) {
                html += createSecondaryButton('Modifier', `window.bracketView.editMatch('${matchId}')`);
            } else if (!isCompleted) {
                html += createPrimaryButton('Saisir Score', `window.bracketView.editMatch('${matchId}')`);
            }

            html += `
                </div>
            `;
        }

        html += `
            </div>
        `;

        return html;
    }

    /**
     * Renders score input form for a match
     * @param {string} matchId - Match identifier
     * @param {number} roundIndex - Round index
     * @param {number} matchIndex - Match index
     * @param {Match} match - Match object
     * @returns {string} HTML for score form
     */
    renderScoreForm(matchId, roundIndex, matchIndex, match) {
        const team1 = this.tournament.teams.get(match.team1Id);
        const team2 = this.tournament.teams.get(match.team2Id);

        return `
            <div class="score-form">
                <div class="form-group">
                    <label for="score1-${escapeHtml(matchId)}">${escapeHtml(team1.name)}</label>
                    <input
                        type="number"
                        id="score1-${escapeHtml(matchId)}"
                        min="0"
                        value="${match.score1 !== null ? match.score1 : ''}"
                        class="score-input"
                    />
                </div>
                <div class="form-group">
                    <label for="score2-${escapeHtml(matchId)}">${escapeHtml(team2.name)}</label>
                    <input
                        type="number"
                        id="score2-${escapeHtml(matchId)}"
                        min="0"
                        value="${match.score2 !== null ? match.score2 : ''}"
                        class="score-input"
                    />
                </div>
                <div class="form-actions">
                    ${createPrimaryButton('Valider', `window.bracketView.saveScore('${matchId}', ${roundIndex}, ${matchIndex})`)}
                    ${createSecondaryButton('Annuler', `window.bracketView.cancelEdit()`)}
                </div>
                <div id="error-${escapeHtml(matchId)}" class="error-message" style="display: none;"></div>
            </div>
        `;
    }

    /**
     * Renders champion section with podium and tournament history
     * @param {string} championId - ID of the champion team
     * @returns {string} HTML for champion section
     */
    renderChampionSection(championId) {
        const champion = this.tournament.teams.get(championId);
        const bracket = this.tournament.bracket;

        // Récupérer le finaliste (perdant de la finale)
        const finaleIndex = bracket.rounds.length - 1;
        const finale = bracket.rounds[finaleIndex][0];
        const finalistId = finale.getWinner() === finale.team1Id ? finale.team2Id : finale.team1Id;
        const finalist = this.tournament.teams.get(finalistId);

        // Récupérer les demi-finalistes (perdants des demi-finales) si elles existent
        const semiFinalsIndex = bracket.rounds.length - 2;
        let thirdPlaces = [];
        if (semiFinalsIndex >= 0 && bracket.rounds[semiFinalsIndex]) {
            const semiFinals = bracket.rounds[semiFinalsIndex];
            thirdPlaces = semiFinals
                .map(match => {
                    const loserId = match.getWinner() === match.team1Id ? match.team2Id : match.team1Id;
                    return this.tournament.teams.get(loserId);
                })
                .filter(team => team);
        }

        let html = `
            <div class="champion-section">
                <h2 class="champion-title">🏆 Champion : ${escapeHtml(champion.name)}</h2>

                <div class="podium">
                    <div class="podium-place podium-first">
                        <div class="podium-rank">1er</div>
                        <div class="podium-team">${escapeHtml(champion.name)}</div>
                        <div class="podium-medal">🥇</div>
                    </div>

                    <div class="podium-place podium-second">
                        <div class="podium-rank">2ème</div>
                        <div class="podium-team">${escapeHtml(finalist.name)}</div>
                        <div class="podium-medal">🥈</div>
                    </div>

                    <div class="podium-place podium-third">
                        <div class="podium-rank">3ème</div>
                        ${thirdPlaces.map(team => `
                            <div class="podium-team">${escapeHtml(team.name)}</div>
                        `).join('')}
                        <div class="podium-medal">🥉</div>
                    </div>
                </div>

                <div class="tournament-complete-message">
                    <p>Félicitations à tous les participants !</p>
                    <p>Le tournoi est maintenant terminé.</p>
                </div>
            </div>
        `;

        // Afficher aussi l'historique complet des rounds
        html += '<div class="bracket-history"><h3>Historique du tournoi</h3>';
        for (let i = 0; i < bracket.rounds.length; i++) {
            html += this.renderRound(i, bracket.rounds[i], 4); // 4 = tournoi terminé
        }
        html += '</div>';

        return html;
    }

    /**
     * Returns index of current round (first round with unplayed matches)
     * @returns {number} Current round index
     */
    getCurrentRoundIndex() {
        const bracket = this.tournament.bracket;

        for (let i = 0; i < bracket.rounds.length; i++) {
            const round = bracket.rounds[i];
            const allPlayed = round.every(match => match.isPlayed);
            if (!allPlayed) {
                return i;
            }
        }

        // Si tous les rounds sont joués, retourner l'index après le dernier round
        return bracket.rounds.length;
    }

    /**
     * Returns total number of matches in the bracket
     * @returns {number} Total match count
     */
    getTotalMatches() {
        const bracket = this.tournament.bracket;
        let total = 0;
        bracket.rounds.forEach(round => {
            total += round.length;
        });
        return total;
    }

    /**
     * Returns number of played matches
     * @returns {number} Played match count
     */
    getPlayedMatches() {
        const bracket = this.tournament.bracket;
        let count = 0;

        bracket.rounds.forEach(round => {
            round.forEach(match => {
                if (match.isPlayed) {
                    count++;
                }
            });
        });

        return count;
    }

    /**
     * Activates editing mode for a match
     * @param {string} matchId - Match identifier
     */
    editMatch(matchId) {
        this.editingMatchId = matchId;
        this.rerender();
    }

    /**
     * Cancels current score editing
     */
    cancelEdit() {
        this.editingMatchId = null;
        this.rerender();
    }

    /**
     * Saves match score with validation and advances winners if round complete
     * @param {string} matchId - Match identifier
     * @param {number} roundIndex - Round index
     * @param {number} matchIndex - Match index
     */
    saveScore(matchId, roundIndex, matchIndex) {
        const score1Input = document.getElementById(`score1-${matchId}`);
        const score2Input = document.getElementById(`score2-${matchId}`);
        const errorDiv = document.getElementById(`error-${matchId}`);

        const score1 = parseInt(score1Input.value);
        const score2 = parseInt(score2Input.value);

        // Validation
        if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
            errorDiv.textContent = 'Les scores doivent être des nombres positifs';
            errorDiv.style.display = 'block';
            return;
        }

        if (score1 === score2) {
            errorDiv.textContent = 'Il ne peut pas y avoir d\'égalité dans un match éliminatoire';
            errorDiv.style.display = 'block';
            return;
        }

        // Enregistrer le score
        const match = this.tournament.bracket.rounds[roundIndex][matchIndex];
        match.setScore(score1, score2);

        // Mettre à jour les statistiques des équipes
        this.tournament.updateTeamStats(match);

        // Vérifier si le round est terminé
        const roundComplete = this.tournament.bracket.rounds[roundIndex].every(m => m.isPlayed);

        if (roundComplete) {
            // Calculer le nombre attendu de rounds selon le nombre d'équipes
            // 8 équipes = 3 rounds, 16 équipes = 4 rounds, 32 équipes = 5 rounds
            const expectedRounds = Math.log2(this.tournament.bracket.teams.length);
            const isFinale = roundIndex === expectedRounds - 1;

            if (isFinale) {
                // La finale est terminée
                const champion = this.tournament.bracket.getChampion();
                const championTeam = this.tournament.teams.get(champion);
                this.tournament.phase = 'finished';
                alert(`Félicitations ! ${championTeam.name} remporte le tournoi !`);
            } else {
                // Faire avancer les gagnants au round suivant
                const advanced = this.tournament.bracket.advanceWinners(roundIndex);

                if (advanced) {
                    const nextRoundName = this.tournament.bracket.getRoundName(roundIndex + 1);
                    alert(`Tous les matches sont terminés ! Passage aux ${nextRoundName}`);
                }
            }
        }

        // Sauvegarder le tournoi
        app.setTournament(this.tournament);

        // Annuler le mode édition et re-render
        this.editingMatchId = null;
        this.rerender();
    }

    /**
     * Re-renders the view while preserving state
     */
    rerender() {
        // Ne pas utiliser app.renderBracket() car ça crée une nouvelle instance
        // et perd l'état (editingMatchId)
        app.renderView(this);
    }

    attachEventListeners() {
        // Exposer l'instance de la vue pour les callbacks
        window.bracketView = this;

        // Ajouter des listeners pour les touches Enter dans les inputs
        const scoreInputs = document.querySelectorAll('.score-input');
        scoreInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    // Trouver le bouton de validation associé
                    const form = input.closest('.score-form');
                    if (form) {
                        const validateButton = form.querySelector('button');
                        if (validateButton) {
                            validateButton.click();
                        }
                    }
                }
            });
        });
    }
}
