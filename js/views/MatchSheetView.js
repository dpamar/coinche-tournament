/**
 * MatchSheetView - Match sheet view with quick score entry
 * Displays current round matches and allows direct score input
 */
class MatchSheetView {
    constructor(tournament) {
        this.tournament = tournament;
        this.editingMatchId = null;
    }

    render() {
        if (!this.tournament) {
            return `
                <div class="match-sheet-container">
                    <h2>Feuille de Matches</h2>
                    <p class="error-message">Aucun tournoi en cours.</p>
                    <div class="action-buttons">
                        ${createSecondaryButton('Retour à l\'accueil', 'router.navigate(\'home\')')}
                    </div>
                </div>
            `;
        }

        let content = `
            <div class="match-sheet-container">
                <div class="match-sheet-header">
                    <h1>${escapeHtml(this.tournament.name)}</h1>
                    <h2>Feuille de Matches - Saisie Rapide</h2>
                </div>
        `;

        // Afficher les matches selon la phase
        if (this.tournament.phase === 'pool') {
            content += this.renderPoolSheet();
        } else if (this.tournament.phase === 'bracket') {
            content += this.renderBracketSheet();
        } else {
            content += '<p class="no-matches">Aucun match à afficher pour le moment.</p>';
        }

        content += `
                <div class="match-sheet-actions">
                    ${createSecondaryButton('Retour', 'goBack()')}
                </div>
            </div>
        `;

        return content;
    }

    /**
     * Renders pool phase sheet with score entry for current round
     * @returns {string} HTML for pool sheet
     */
    renderPoolSheet() {
        if (!this.tournament.pools || this.tournament.pools.length === 0) {
            return '<p class="no-matches">Aucune poule configurée.</p>';
        }

        // Déterminer le round global (minimum de tous les rounds des poules)
        const globalRound = this.getGlobalCurrentRound();

        if (globalRound === null) {
            return '<p class="no-matches">Tous les matches de poules sont terminés !</p>';
        }

        let html = '<div class="match-sheet-pools">';
        html += `<div class="match-sheet-header"><h2>Round ${globalRound + 1}</h2></div>`;

        // Parcourir chaque poule
        this.tournament.pools.forEach((pool, poolIndex) => {
            const poolName = `Poule ${String.fromCharCode(65 + poolIndex)}`;

            // Récupérer les matches du round global
            const roundMatches = this.getRoundMatches(pool, globalRound);

            // Skip si pas de matches pour cette poule dans ce round
            if (roundMatches.length === 0) {
                return;
            }

            html += `<div class="match-sheet-pool">`;
            html += `<h3>${escapeHtml(poolName)}</h3>`;
            html += `<div class="matches-grid">`;

            // Afficher les matches du round global
            roundMatches.forEach(matchIndex => {
                const match = pool.matches[matchIndex];
                const matchId = `pool-${poolIndex}-${matchIndex}`;
                const isInterPool = matchIndex >= 6;
                html += this.renderMatchCard(match, matchId, poolIndex, matchIndex, isInterPool);
            });

            html += `</div></div>`;
        });

        html += '</div>';
        return html;
    }

    /**
     * Determines global current round (minimum across all pools)
     * @returns {number|null} Round index or null if all matches played
     */
    getGlobalCurrentRound() {
        let minRound = null;

        this.tournament.pools.forEach(pool => {
            const poolRound = this.getCurrentRoundForPool(pool);

            if (poolRound !== null) {
                if (minRound === null || poolRound < minRound) {
                    minRound = poolRound;
                }
            }
        });

        return minRound;
    }

    /**
     * Determines current round for a pool (0, 1, or 2)
     * Inter-pool matches are played in parallel with internal rounds
     * @param {Pool} pool - Pool object
     * @returns {number|null} Round index or null if all matches played
     */
    getCurrentRoundForPool(pool) {
        // Chercher le premier round qui a au moins un match non joué
        for (let roundIndex = 0; roundIndex < 3; roundIndex++) {
            const matchIndices = this.getRoundMatches(pool, roundIndex);
            const hasUnplayedMatch = matchIndices.some(idx =>
                idx < pool.matches.length && !pool.matches[idx].isPlayed
            );

            if (hasUnplayedMatch) {
                return roundIndex;
            }
        }

        return null; // Tous les matches sont joués
    }

    /**
     * Returns match indices for a given round
     * Includes internal matches (2 per round) AND corresponding inter-pool match (if exists)
     * Round 0: matches 0-1 + inter-pool index 6
     * Round 1: matches 2-3 + inter-pool index 7
     * Round 2: matches 4-5 + inter-pool index 8
     * @param {Pool} pool - Pool object
     * @param {number} roundIndex - Round index (0-2)
     * @returns {Array} Array of match indices
     */
    getRoundMatches(pool, roundIndex) {
        const internalMatches = [
            [0, 1], // Round 1: matches internes 0-1
            [2, 3], // Round 2: matches internes 2-3
            [4, 5]  // Round 3: matches internes 4-5
        ];

        // Commencer avec les matches internes du round
        const matches = [...internalMatches[roundIndex]];

        // Ajouter le match inter-poule correspondant s'il existe
        const interPoolIndex = 6 + roundIndex; // 6, 7 ou 8
        if (interPoolIndex < pool.matches.length) {
            matches.push(interPoolIndex);
        }

        return matches.filter(idx => idx < pool.matches.length);
    }

    /**
     * Renders a match card with score entry
     * @param {Match} match - Match object
     * @param {string} matchId - Match identifier
     * @param {number} poolIndex - Pool index
     * @param {number} matchIndex - Match index
     * @param {boolean} isInterPool - Whether this is an inter-pool match
     * @returns {string} HTML match card
     */
    renderMatchCard(match, matchId, poolIndex, matchIndex, isInterPool = false) {
        const team1 = this.tournament.teams.get(match.team1Id);
        const team2 = this.tournament.teams.get(match.team2Id);
        const team1Name = team1 ? team1.name : 'Équipe inconnue';
        const team2Name = team2 ? team2.name : 'Équipe inconnue';

        const isEditing = this.editingMatchId === matchId;
        const isPlayed = match.isPlayed;
        const cardClass = isInterPool ? 'match-card-inter-pool' : '';

        if (isPlayed) {
            // Match déjà joué - affichage en vert avec scores et vainqueur en bleu
            const team1Won = match.score1 > match.score2;
            const team2Won = match.score2 > match.score1;

            return `
                <div class="match-card match-played ${cardClass}">
                    <div class="match-team-result ${team1Won ? 'winner' : ''}">
                        <span class="team-name">${escapeHtml(team1Name)}</span>
                        <span class="team-score">${match.score1}</span>
                    </div>
                    <div class="vs">VS</div>
                    <div class="match-team-result ${team2Won ? 'winner' : ''}">
                        <span class="team-name">${escapeHtml(team2Name)}</span>
                        <span class="team-score">${match.score2}</span>
                    </div>
                </div>
            `;
        } else if (isEditing) {
            return `
                <div class="match-card editing ${cardClass}">
                    <div class="match-teams">
                        <div class="team-input">
                            <label>${escapeHtml(team1Name)}</label>
                            <input type="number" id="score1-${matchId}" min="0" class="score-input" autofocus>
                        </div>
                        <div class="vs">VS</div>
                        <div class="team-input">
                            <label>${escapeHtml(team2Name)}</label>
                            <input type="number" id="score2-${matchId}" min="0" class="score-input">
                        </div>
                    </div>
                    <div class="match-actions">
                        ${createPrimaryButton('Valider', `window.matchSheetView.saveScore('${matchId}', ${poolIndex}, ${matchIndex})`)}
                        ${createSecondaryButton('Annuler', `window.matchSheetView.cancelEdit()`)}
                    </div>
                    <div id="error-${matchId}" class="error-message" style="display: none;"></div>
                </div>
            `;
        } else {
            return `
                <div class="match-card ${cardClass}">
                    <div class="match-teams">
                        <div class="team">${escapeHtml(team1Name)}</div>
                        <div class="vs">VS</div>
                        <div class="team">${escapeHtml(team2Name)}</div>
                    </div>
                    <div class="match-actions">
                        ${createPrimaryButton('Saisir Score', `window.matchSheetView.editMatch('${matchId}')`)}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Renders bracket phase sheet with current round matches
     * @returns {string} HTML for bracket sheet
     */
    renderBracketSheet() {
        const bracket = this.tournament.bracket;

        if (!bracket || bracket.rounds.length === 0) {
            return '<p class="no-matches">Aucun match éliminatoire configuré.</p>';
        }

        // Trouver le round actuel (premier round avec au moins un match non joué)
        const currentRoundIndex = this.getCurrentBracketRound();

        if (currentRoundIndex === null) {
            return '<p class="no-matches">Tous les matches éliminatoires sont terminés.</p>';
        }

        const currentRound = bracket.rounds[currentRoundIndex];
        const roundName = bracket.getRoundName(currentRoundIndex);

        let html = `<div class="match-sheet-bracket">`;
        html += `<h3>${escapeHtml(roundName)}</h3>`;
        html += `<div class="matches-grid">`;

        currentRound.forEach((match, matchIndex) => {
            if (!match.isPlayed) {
                const matchId = `bracket-${currentRoundIndex}-${matchIndex}`;
                html += this.renderBracketMatchCard(match, matchId, currentRoundIndex, matchIndex);
            }
        });

        html += `</div></div>`;
        return html;
    }

    /**
     * Renders a bracket match card with score entry
     * @param {Match} match - Match object
     * @param {string} matchId - Match identifier
     * @param {number} roundIndex - Round index
     * @param {number} matchIndex - Match index
     * @returns {string} HTML match card
     */
    renderBracketMatchCard(match, matchId, roundIndex, matchIndex) {
        const team1 = this.tournament.teams.get(match.team1Id);
        const team2 = this.tournament.teams.get(match.team2Id);

        if (!team1 || !team2) {
            return `
                <div class="match-card disabled">
                    <div class="match-teams">
                        <div class="team">En attente...</div>
                    </div>
                </div>
            `;
        }

        const team1Name = team1.name;
        const team2Name = team2.name;
        const isEditing = this.editingMatchId === matchId;

        if (isEditing) {
            return `
                <div class="match-card editing">
                    <div class="match-teams">
                        <div class="team-input">
                            <label>${escapeHtml(team1Name)}</label>
                            <input type="number" id="score1-${matchId}" min="0" class="score-input" autofocus>
                        </div>
                        <div class="vs">VS</div>
                        <div class="team-input">
                            <label>${escapeHtml(team2Name)}</label>
                            <input type="number" id="score2-${matchId}" min="0" class="score-input">
                        </div>
                    </div>
                    <div class="match-actions">
                        ${createPrimaryButton('Valider', `window.matchSheetView.saveBracketScore('${matchId}', ${roundIndex}, ${matchIndex})`)}
                        ${createSecondaryButton('Annuler', `window.matchSheetView.cancelEdit()`)}
                    </div>
                    <div id="error-${matchId}" class="error-message" style="display: none;"></div>
                </div>
            `;
        } else {
            return `
                <div class="match-card">
                    <div class="match-teams">
                        <div class="team">${escapeHtml(team1Name)}</div>
                        <div class="vs">VS</div>
                        <div class="team">${escapeHtml(team2Name)}</div>
                    </div>
                    <div class="match-actions">
                        ${createPrimaryButton('Saisir Score', `window.matchSheetView.editMatch('${matchId}')`)}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Returns index of current bracket round
     * @returns {number|null} Round index or null if all matches played
     */
    getCurrentBracketRound() {
        const bracket = this.tournament.bracket;
        for (let i = 0; i < bracket.rounds.length; i++) {
            const hasUnplayedMatch = bracket.rounds[i].some(m => !m.isPlayed);
            if (hasUnplayedMatch) {
                return i;
            }
        }
        return null;
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
     * Cancels score editing
     */
    cancelEdit() {
        this.editingMatchId = null;
        this.rerender();
    }

    /**
     * Saves pool match score with validation and checks round completion
     * @param {string} matchId - Match identifier
     * @param {number} poolIndex - Pool index
     * @param {number} matchIndex - Match index
     */
    saveScore(matchId, poolIndex, matchIndex) {
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

        // Enregistrer le score
        const match = this.tournament.pools[poolIndex].matches[matchIndex];
        match.setScore(score1, score2);

        // Mettre à jour les statistiques
        this.tournament.updateTeamStats(match);

        // Sauvegarder
        this.tournament.save();

        // Vérifier si le round global actuel est terminé
        const globalRound = this.getGlobalCurrentRound();

        if (globalRound !== null) {
            // Vérifier si TOUS les matches du round global sont terminés (toutes poules confondues)
            const allGlobalRoundPlayed = this.tournament.pools.every(pool => {
                const roundMatches = this.getRoundMatches(pool, globalRound);
                return roundMatches.every(idx => pool.matches[idx].isPlayed);
            });

            if (allGlobalRoundPlayed) {
                const roundNumber = globalRound + 1;
                if (globalRound < 2) {
                    alert(`Round ${roundNumber} terminé ! Passage au round suivant.`);
                } else {
                    alert('Tous les matches de poules sont terminés ! Vous pouvez passer à la phase finale.');
                }
            }
        } else {
            // Plus aucun round - tous les matches sont terminés
            alert('Tous les matches de poules sont terminés ! Vous pouvez passer à la phase finale.');
        }

        // Retour à la vue normale
        this.editingMatchId = null;
        this.rerender();
    }

    /**
     * Saves bracket match score with validation and advances winners
     * @param {string} matchId - Match identifier
     * @param {number} roundIndex - Round index
     * @param {number} matchIndex - Match index
     */
    saveBracketScore(matchId, roundIndex, matchIndex) {
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

        // Mettre à jour les statistiques
        this.tournament.updateTeamStats(match);

        // Vérifier si le round est terminé
        const roundComplete = this.tournament.bracket.rounds[roundIndex].every(m => m.isPlayed);

        if (roundComplete) {
            const expectedRounds = Math.log2(this.tournament.bracket.teams.length);
            const isFinale = roundIndex === expectedRounds - 1;

            if (isFinale) {
                const champion = this.tournament.bracket.getChampion();
                const championTeam = this.tournament.teams.get(champion);
                this.tournament.phase = 'finished';
                alert(`Félicitations ! ${championTeam.name} remporte le tournoi !`);
            } else {
                const advanced = this.tournament.bracket.advanceWinners(roundIndex);
                if (advanced) {
                    const nextRoundName = this.tournament.bracket.getRoundName(roundIndex + 1);
                    alert(`Tous les matches sont terminés ! Passage aux ${nextRoundName}`);
                }
            }
        }

        // Sauvegarder
        this.tournament.save();

        // Retour à la vue normale
        this.editingMatchId = null;
        this.rerender();
    }

    /**
     * Re-renders the view while preserving state
     */
    rerender() {
        app.renderView(this);
    }

    attachEventListeners() {
        // Les événements sont gérés par le système global data-action
        window.matchSheetView = this;
    }
}

/**
 * Global function to navigate back to appropriate phase view
 */
function goBack() {
    if (app.tournament.phase === 'pool') {
        router.navigate('pool-phase');
    } else if (app.tournament.phase === 'bracket') {
        router.navigate('bracket');
    } else {
        router.navigate('home');
    }
}
