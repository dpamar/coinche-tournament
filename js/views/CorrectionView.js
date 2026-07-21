/**
 * CorrectionView - Vue de correction des scores
 * Permet de corriger les scores déjà saisis pour n'importe quel match du tournoi
 */
class CorrectionView {
    constructor(tournament) {
        this.tournament = tournament;
        this.editingMatchId = null;
    }

    render() {
        if (!this.tournament) {
            return `
                <div class="correction-container">
                    <h2>Correction des Scores</h2>
                    <p class="error-message">Aucun tournoi actif. Veuillez d'abord créer un tournoi.</p>
                    <div class="action-buttons">
                        ${createPrimaryButton('Retour à l\'accueil', 'goToHome')}
                    </div>
                </div>
            `;
        }

        const hasBracket = this.tournament.bracket && this.tournament.bracket.rounds.length > 0;

        return `
            <div class="correction-container">
                <h2>Correction des Scores - ${escapeHtml(this.tournament.name)}</h2>

                ${hasBracket ? this.renderWarning() : ''}

                <div class="matches-sections">
                    ${this.renderPoolMatches()}
                    ${hasBracket ? this.renderBracketMatches() : ''}
                </div>

                <div class="action-buttons">
                    ${createSecondaryButton('Retour à l\'accueil', 'goToHome')}
                </div>
            </div>
        `;
    }

    renderWarning() {
        return `
            <div class="warning-box">
                <strong>⚠️ Attention :</strong> La modification des scores de la phase de poules
                peut affecter les qualifications pour la phase éliminatoire. Si vous modifiez ces scores,
                vous devrez peut-être régénérer le bracket.
            </div>
        `;
    }

    renderPoolMatches() {
        if (!this.tournament.pools || this.tournament.pools.length === 0) {
            return '';
        }

        const poolsHtml = this.tournament.pools.map((pool, index) => {
            const poolName = `Poule ${String.fromCharCode(65 + index)}`;
            return `
                <div class="match-section">
                    <h3>Phase de Poules - ${escapeHtml(poolName)}</h3>
                    ${this.renderMatchesTable(pool.matches, 'pool', index)}
                </div>
            `;
        }).join('');

        return poolsHtml;
    }

    renderBracketMatches() {
        if (!this.tournament.bracket) {
            return '';
        }

        const roundsHtml = this.tournament.bracket.rounds.map((round, roundIndex) => {
            const roundName = this.tournament.bracket.getRoundName(roundIndex);
            return `
                <div class="match-section">
                    <h3>${escapeHtml(roundName)}</h3>
                    ${this.renderMatchesTable(round, 'bracket', roundIndex)}
                </div>
            `;
        }).join('');

        return roundsHtml;
    }

    renderMatchesTable(matches, type, index) {
        if (!matches || matches.length === 0) {
            return '<p class="no-matches">Aucun match dans cette section</p>';
        }

        const rows = matches.map((match, matchIndex) => {
            const team1 = this.tournament.teams.get(match.team1Id);
            const team2 = this.tournament.teams.get(match.team2Id);
            const team1Name = team1 ? team1.name : 'Équipe inconnue';
            const team2Name = team2 ? team2.name : 'Équipe inconnue';

            const matchId = `${type}-${index}-${matchIndex}`;
            const isEditing = this.editingMatchId === matchId;

            let scoreDisplay;
            let statusClass;
            let statusText;
            let actionButton;

            if (match.isPlayed) {
                scoreDisplay = `${match.score1} - ${match.score2}`;
                statusClass = 'status-played';
                statusText = 'Joué';
                actionButton = createButton('Modifier', `editMatch('${matchId}')`, 'btn-secondary btn-small');
            } else {
                scoreDisplay = '- - -';
                statusClass = 'status-not-played';
                statusText = 'Non joué';
                actionButton = createButton('Saisir', `editMatch('${matchId}')`, 'btn-primary btn-small');
            }

            if (isEditing) {
                return `
                    <tr class="editing-row">
                        <td>${escapeHtml(team1Name)}</td>
                        <td class="score-edit">
                            <input type="number"
                                   id="score1-${matchId}"
                                   value="${match.score1 !== null ? match.score1 : ''}"
                                   min="0"
                                   class="score-input"
                                   placeholder="0">
                            <span class="score-separator">-</span>
                            <input type="number"
                                   id="score2-${matchId}"
                                   value="${match.score2 !== null ? match.score2 : ''}"
                                   min="0"
                                   class="score-input"
                                   placeholder="0">
                        </td>
                        <td>${escapeHtml(team2Name)}</td>
                        <td class="status ${statusClass}">${escapeHtml(statusText)}</td>
                        <td class="actions">
                            ${createButton('Enregistrer', `saveMatch('${matchId}', ${matchIndex}, '${type}', ${index})`, 'btn-primary btn-small')}
                            ${createButton('Annuler', `cancelEdit()`, 'btn-secondary btn-small')}
                        </td>
                    </tr>
                `;
            }

            return `
                <tr>
                    <td>${escapeHtml(team1Name)}</td>
                    <td class="score">${escapeHtml(scoreDisplay)}</td>
                    <td>${escapeHtml(team2Name)}</td>
                    <td class="status ${statusClass}">${escapeHtml(statusText)}</td>
                    <td class="actions">${actionButton}</td>
                </tr>
            `;
        }).join('');

        return `
            <table class="matches-table">
                <thead>
                    <tr>
                        <th>Équipe 1</th>
                        <th>Score</th>
                        <th>Équipe 2</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    attachEventListeners() {
        // Store reference to this view in the DOM for global functions
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent._correctionView = this;
        }
    }

    editMatch(matchId) {
        this.editingMatchId = matchId;
        this.rerenderView();
    }

    cancelEdit() {
        this.editingMatchId = null;
        this.rerenderView();
    }

    saveMatch(matchId, matchIndex, type, sectionIndex) {
        const score1Input = document.getElementById(`score1-${matchId}`);
        const score2Input = document.getElementById(`score2-${matchId}`);

        if (!score1Input || !score2Input) {
            alert('Erreur : impossible de trouver les champs de score');
            return;
        }

        const score1 = parseInt(score1Input.value);
        const score2 = parseInt(score2Input.value);

        if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
            alert('Veuillez saisir des scores valides (nombres entiers positifs)');
            return;
        }

        // Get the match object
        let match;
        if (type === 'pool') {
            match = this.tournament.pools[sectionIndex].matches[matchIndex];
        } else if (type === 'bracket') {
            match = this.tournament.bracket.rounds[sectionIndex][matchIndex];
        }

        if (!match) {
            alert('Erreur : match introuvable');
            return;
        }

        // Check if modifying pool match after bracket started
        if (type === 'pool' && this.tournament.bracket && this.tournament.bracket.rounds.length > 0) {
            const confirmed = confirm(
                'Attention : Vous modifiez un score de la phase de poules alors que la phase éliminatoire a déjà commencé. ' +
                'Cette modification peut affecter les qualifications. Voulez-vous continuer ?'
            );
            if (!confirmed) {
                this.cancelEdit();
                return;
            }
        }

        // Save old state for recalculation
        const wasPlayed = match.isPlayed;
        const oldScore1 = match.score1;
        const oldScore2 = match.score2;

        // Reset team stats if match was already played
        if (wasPlayed) {
            this.resetMatchStats(match);
        }

        // Set new score
        match.setScore(score1, score2);

        // Recalculate team stats
        this.updateMatchStats(match);

        // If pool phase modified and bracket exists, show recalculation option
        if (type === 'pool' && this.tournament.bracket && this.tournament.bracket.rounds.length > 0) {
            const recalc = confirm(
                'Score modifié avec succès. Voulez-vous recalculer les qualifications et régénérer la phase éliminatoire ?'
            );
            if (recalc) {
                this.regenerateBracket();
            }
        }

        // Save tournament
        if (typeof app !== 'undefined' && typeof app.setTournament === 'function') {
            app.setTournament(this.tournament);
        } else {
            this.tournament.save();
        }

        // Clear editing state and rerender
        this.editingMatchId = null;
        this.showSuccessMessage('Score enregistré avec succès');
        this.rerenderView();
    }

    resetMatchStats(match) {
        const team1 = this.tournament.teams.get(match.team1Id);
        const team2 = this.tournament.teams.get(match.team2Id);

        if (team1 && match.isPlayed) {
            team1.matchesPlayed--;
            team1.pointsScored -= match.score1;
            team1.pointsConceded -= match.score2;
            if (match.score1 > match.score2) {
                team1.matchesWon--;
            }
        }

        if (team2 && match.isPlayed) {
            team2.matchesPlayed--;
            team2.pointsScored -= match.score2;
            team2.pointsConceded -= match.score1;
            if (match.score2 > match.score1) {
                team2.matchesWon--;
            }
        }
    }

    updateMatchStats(match) {
        if (!match.isPlayed) {
            return;
        }

        const team1 = this.tournament.teams.get(match.team1Id);
        const team2 = this.tournament.teams.get(match.team2Id);

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

    regenerateBracket() {
        try {
            // Reset bracket
            this.tournament.bracket = null;
            this.tournament.phase = 'pool';

            // Get qualified teams with new rankings
            const qualifiedTeams = this.tournament.getQualifiedTeams();

            if (qualifiedTeams.length !== 16) {
                alert(`Impossible de régénérer le bracket : ${qualifiedTeams.length} équipes qualifiées au lieu de 16`);
                return;
            }

            // Create new bracket
            this.tournament.bracket = new Bracket(qualifiedTeams);
            this.tournament.bracket.initializeBracket();
            this.tournament.phase = 'bracket';

            this.showSuccessMessage('Bracket régénéré avec succès avec les nouvelles qualifications');
        } catch (error) {
            alert('Erreur lors de la régénération du bracket : ' + error.message);
        }
    }

    showSuccessMessage(message) {
        // Simple success notification
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    rerenderView() {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = this.render();
            this.attachEventListeners();
        }
    }
}

// Global functions for button onclick handlers
function editMatch(matchId) {
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent._correctionView) {
        mainContent._correctionView.editMatch(matchId);
    }
}

function cancelEdit() {
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent._correctionView) {
        mainContent._correctionView.cancelEdit();
    }
}

function saveMatch(matchId, matchIndex, type, sectionIndex) {
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent._correctionView) {
        mainContent._correctionView.saveMatch(matchId, matchIndex, type, sectionIndex);
    }
}

function goToHome() {
    if (typeof router !== 'undefined') {
        router.navigate('home');
    }
}
