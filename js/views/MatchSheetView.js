/**
 * MatchSheetView - Vue pour la feuille de matches avec saisie de scores
 * Affiche les matches à jouer et permet de saisir les scores directement
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
     * Rend la feuille pour la phase de poules avec saisie de scores
     */
    renderPoolSheet() {
        if (!this.tournament.pools || this.tournament.pools.length === 0) {
            return '<p class="no-matches">Aucune poule configurée.</p>';
        }

        let html = '<div class="match-sheet-pools">';

        // Parcourir chaque poule
        this.tournament.pools.forEach((pool, poolIndex) => {
            const poolName = `Poule ${String.fromCharCode(65 + poolIndex)}`;

            // Récupérer tous les matches non joués de cette poule
            const unplayedMatches = pool.matches.filter(m => !m.isPlayed);

            if (unplayedMatches.length === 0) {
                return; // Skip cette poule si tous les matches sont joués
            }

            html += `<div class="match-sheet-pool">`;
            html += `<h3>${escapeHtml(poolName)}</h3>`;
            html += `<div class="matches-grid">`;

            // Afficher tous les matches non joués
            unplayedMatches.forEach((match, idx) => {
                const matchIndex = pool.matches.indexOf(match);
                const matchId = `pool-${poolIndex}-${matchIndex}`;
                html += this.renderMatchCard(match, matchId, poolIndex, matchIndex);
            });

            html += `</div></div>`;
        });

        html += '</div>';
        return html;
    }

    /**
     * Rend une carte de match avec saisie de score
     */
    renderMatchCard(match, matchId, poolIndex, matchIndex) {
        const team1 = this.tournament.teams.get(match.team1Id);
        const team2 = this.tournament.teams.get(match.team2Id);
        const team1Name = team1 ? team1.name : 'Équipe inconnue';
        const team2Name = team2 ? team2.name : 'Équipe inconnue';

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
                        ${createPrimaryButton('Valider', `window.matchSheetView.saveScore('${matchId}', ${poolIndex}, ${matchIndex})`)}
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
     * Rend la feuille pour la phase éliminatoire
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
     * Rend une carte de match bracket avec saisie
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
     * Retourne l'index du round actuel du bracket
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
     * Active le mode édition pour un match
     */
    editMatch(matchId) {
        this.editingMatchId = matchId;
        this.rerender();
    }

    /**
     * Annule l'édition
     */
    cancelEdit() {
        this.editingMatchId = null;
        this.rerender();
    }

    /**
     * Sauvegarde le score d'un match de poule
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

        // Retour à la vue normale
        this.editingMatchId = null;
        this.rerender();
    }

    /**
     * Sauvegarde le score d'un match de bracket
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
     * Re-render la vue
     */
    rerender() {
        app.renderView(this);
    }

    attachEventListeners() {
        // Les événements sont gérés par le système global data-action
        window.matchSheetView = this;
    }
}

// Global function to go back
function goBack() {
    if (app.tournament.phase === 'pool') {
        router.navigate('pool-phase');
    } else if (app.tournament.phase === 'bracket') {
        router.navigate('bracket');
    } else {
        router.navigate('home');
    }
}
