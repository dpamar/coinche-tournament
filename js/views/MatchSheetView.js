/**
 * MatchSheetView - Vue pour la feuille de matches
 * Génère une feuille imprimable des matches à jouer
 */
class MatchSheetView {
    constructor(tournament) {
        this.tournament = tournament;
    }

    render() {
        if (!this.tournament) {
            return `
                <div class="match-sheet-container">
                    <h2>Feuille de Matches</h2>
                    <p class="error-message">Aucun tournoi en cours.</p>
                    <div class="action-buttons">
                        ${createSecondaryButton('Retour à l\'accueil', 'goToHome')}
                    </div>
                </div>
            `;
        }

        let content = `
            <div class="match-sheet-container">
                <div class="match-sheet-header">
                    <h1>${escapeHtml(this.tournament.name)}</h1>
                    <h2>Feuille de Matches</h2>
                    <p class="match-sheet-date">Date: ${this.getCurrentDate()}</p>
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
                <div class="match-sheet-actions no-print">
                    ${createPrimaryButton('Imprimer', 'window.print()')}
                    ${createSecondaryButton('Retour', 'goBack()')}
                </div>
            </div>
        `;

        return content;
    }

    /**
     * Retourne la date actuelle formatée
     */
    getCurrentDate() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return now.toLocaleDateString('fr-FR', options);
    }

    /**
     * Rend la feuille pour la phase de poules
     */
    renderPoolSheet() {
        if (!this.tournament.pools || this.tournament.pools.length === 0) {
            return '<p class="no-matches">Aucune poule configurée.</p>';
        }

        let html = '<div class="match-sheet-pools">';

        // Parcourir chaque poule
        this.tournament.pools.forEach((pool, poolIndex) => {
            const poolName = `Poule ${String.fromCharCode(65 + poolIndex)}`;
            html += `<div class="match-sheet-pool">`;
            html += `<h3>${escapeHtml(poolName)}</h3>`;

            // Déterminer le prochain round non joué
            const nextRound = this.getNextRoundForPool(pool);

            if (nextRound !== null) {
                html += this.renderRoundMatches(pool, nextRound, poolIndex);
            } else {
                // Tous les matches sont joués
                html += '<p class="round-complete">Tous les matches de cette poule sont terminés.</p>';
            }

            html += `</div>`;
        });

        html += '</div>';
        return html;
    }

    /**
     * Détermine le prochain round non joué pour une poule
     * Retourne le numéro du round (0, 1, ou 2) ou null si tous sont joués
     */
    getNextRoundForPool(pool) {
        const matches = pool.matches;

        // Pour les poules de 4, les matches sont organisés en 3 rounds de 2 matches
        // Round 0: matches 0-1 (indices 0 et 1)
        // Round 1: matches 2-3 (indices 2 et 3)
        // Round 2: matches 4-5 (indices 4 et 5)

        const rounds = [
            [0, 1], // Round 1
            [2, 3], // Round 2
            [4, 5]  // Round 3
        ];

        // Chercher le premier round qui a au moins un match non joué
        for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
            const matchIndices = rounds[roundIndex];
            const hasUnplayedMatch = matchIndices.some(idx =>
                idx < matches.length && !matches[idx].isPlayed
            );

            if (hasUnplayedMatch) {
                return roundIndex;
            }
        }

        return null; // Tous les matches sont joués
    }

    /**
     * Rend les matches d'un round spécifique
     */
    renderRoundMatches(pool, roundIndex, poolIndex) {
        const rounds = [
            [0, 1], // Round 1
            [2, 3], // Round 2
            [4, 5]  // Round 3
        ];

        const matchIndices = rounds[roundIndex];
        const roundNumber = roundIndex + 1;

        let html = `<div class="match-sheet-round">`;
        html += `<h4>Round ${roundNumber}</h4>`;
        html += `<table class="match-sheet-table">`;
        html += `<thead>
            <tr>
                <th>Match</th>
                <th>Équipe 1</th>
                <th>Score</th>
                <th>Équipe 2</th>
                <th>Table</th>
            </tr>
        </thead>`;
        html += `<tbody>`;

        matchIndices.forEach((matchIdx, position) => {
            if (matchIdx < pool.matches.length) {
                const match = pool.matches[matchIdx];
                const team1 = this.tournament.teams.get(match.team1Id);
                const team2 = this.tournament.teams.get(match.team2Id);
                const team1Name = team1 ? team1.name : 'Équipe inconnue';
                const team2Name = team2 ? team2.name : 'Équipe inconnue';
                const matchNumber = matchIdx + 1;

                html += `
                    <tr>
                        <td class="match-number">Match ${matchNumber}</td>
                        <td class="team-name">${escapeHtml(team1Name)}</td>
                        <td class="score-cell">_____ - _____</td>
                        <td class="team-name">${escapeHtml(team2Name)}</td>
                        <td class="table-number">Table ${position + 1}</td>
                    </tr>
                `;
            }
        });

        html += `</tbody></table></div>`;
        return html;
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
        html += `<table class="match-sheet-table">`;
        html += `<thead>
            <tr>
                <th>Match</th>
                <th>Équipe 1</th>
                <th>Score</th>
                <th>Équipe 2</th>
                <th>Table</th>
            </tr>
        </thead>`;
        html += `<tbody>`;

        currentRound.forEach((match, matchIndex) => {
            const team1 = this.tournament.teams.get(match.team1Id);
            const team2 = this.tournament.teams.get(match.team2Id);

            // Si les équipes ne sont pas encore définies, afficher un placeholder
            if (!team1 || !team2) {
                html += `
                    <tr class="match-pending">
                        <td class="match-number">Match ${matchIndex + 1}</td>
                        <td class="team-name" colspan="3">En attente des résultats précédents</td>
                        <td class="table-number">-</td>
                    </tr>
                `;
            } else {
                const team1Name = team1.name;
                const team2Name = team2.name;

                html += `
                    <tr>
                        <td class="match-number">Match ${matchIndex + 1}</td>
                        <td class="team-name">${escapeHtml(team1Name)}</td>
                        <td class="score-cell">_____ - _____</td>
                        <td class="team-name">${escapeHtml(team2Name)}</td>
                        <td class="table-number">Table ${matchIndex + 1}</td>
                    </tr>
                `;
            }
        });

        html += `</tbody></table></div>`;
        return html;
    }

    /**
     * Retourne l'index du round actuel du bracket
     * (premier round avec au moins un match non joué)
     */
    getCurrentBracketRound() {
        const bracket = this.tournament.bracket;

        for (let i = 0; i < bracket.rounds.length; i++) {
            const round = bracket.rounds[i];
            const hasUnplayedMatch = round.some(match => !match.isPlayed);

            if (hasUnplayedMatch) {
                return i;
            }
        }

        return null; // Tous les rounds sont joués
    }

    attachEventListeners() {
        // Pas besoin d'event listeners spécifiques pour cette vue
        // Les boutons utilisent des fonctions globales déjà définies
    }
}

// Fonction globale pour revenir en arrière
function goBack() {
    if (typeof router !== 'undefined') {
        // Retourner à la vue appropriée selon la phase
        if (app.tournament) {
            if (app.tournament.phase === 'pool') {
                router.navigate('pool-phase');
            } else if (app.tournament.phase === 'bracket') {
                router.navigate('bracket');
            } else {
                router.navigate('home');
            }
        } else {
            router.navigate('home');
        }
    }
}
