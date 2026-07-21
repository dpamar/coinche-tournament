/**
 * PoolPhaseView - Vue de la phase de poules
 * Permet de gérer les matches de poule et saisir les scores
 */
class PoolPhaseView {
    constructor(tournament) {
        this.tournament = tournament;
        this.currentPoolIndex = 0;
        this.editingMatchId = null;
    }

    render() {
        if (!this.tournament || !this.tournament.pools || this.tournament.pools.length === 0) {
            return `
                <div class="pool-phase-container">
                    <h2>Phase de Poules</h2>
                    <p class="error-message">Aucune poule configurée. Veuillez d'abord configurer le tournoi.</p>
                    <div class="action-buttons">
                        ${createPrimaryButton('Retour à la configuration', 'goToSetup')}
                    </div>
                </div>
            `;
        }

        const stats = this.getPoolPhaseStats();
        const allMatchesPlayed = stats.matchesPlayed === stats.totalMatches;

        return `
            <div class="pool-phase-container">
                <h2>Phase de Poules - ${escapeHtml(this.tournament.name)}</h2>

                <div class="phase-progress">
                    <div class="progress-info">
                        <span class="progress-label">Progression</span>
                        <span class="progress-value">${stats.matchesPlayed} / ${stats.totalMatches} matches joués</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.progress}%"></div>
                    </div>
                </div>

                ${this.renderPoolTabs()}

                <div class="pool-content">
                    ${this.renderCurrentPool()}
                </div>

                ${allMatchesPlayed ? this.renderQualificationSection() : ''}

                <div class="action-buttons">
                    ${createPrimaryButton('Feuille de Matches', 'goToMatchSheet()')}
                    ${createSecondaryButton('Exporter le Tournoi', 'exportTournament()')}
                    ${createSecondaryButton('Retour à l\'accueil', 'goToHome')}
                </div>
            </div>
        `;
    }

    getPoolPhaseStats() {
        let matchesPlayed = 0;
        let totalMatches = 0;

        this.tournament.pools.forEach(pool => {
            totalMatches += pool.matches.length;
            matchesPlayed += pool.matches.filter(m => m.isPlayed).length;
        });

        const progress = totalMatches > 0 ? Math.round((matchesPlayed / totalMatches) * 100) : 0;

        return {
            matchesPlayed,
            totalMatches,
            progress
        };
    }

    renderPoolTabs() {
        const tabs = this.tournament.pools.map((pool, index) => {
            const poolName = `Poule ${String.fromCharCode(65 + index)}`;
            const isActive = index === this.currentPoolIndex;
            const activeClass = isActive ? 'active' : '';

            return `
                <button class="pool-tab ${activeClass}"
                        data-pool-index="${index}"
                        onclick="switchPool(${index})">
                    ${escapeHtml(poolName)}
                </button>
            `;
        }).join('');

        return `
            <div class="pool-tabs">
                ${tabs}
            </div>
        `;
    }

    renderCurrentPool() {
        const pool = this.tournament.pools[this.currentPoolIndex];
        if (!pool) {
            return '<p class="error-message">Poule introuvable</p>';
        }

        const poolName = `Poule ${String.fromCharCode(65 + this.currentPoolIndex)}`;
        const ranking = pool.getRanking(this.tournament.teams);

        return `
            <div class="pool-details">
                <h3>${escapeHtml(poolName)}</h3>

                <div class="pool-section">
                    <h4>Classement</h4>
                    ${this.renderRankingTable(ranking)}
                </div>

                <div class="pool-section">
                    <h4>Matches</h4>
                    ${this.renderMatchesTable(pool.matches, this.currentPoolIndex)}
                </div>
            </div>
        `;
    }

    renderRankingTable(ranking) {
        if (!ranking || ranking.length === 0) {
            return '<p class="no-data">Aucune équipe dans cette poule</p>';
        }

        const headers = ['Rang', 'Équipe', 'V', 'D', 'PM', 'PE', 'GA'];

        const rows = ranking.map((teamStats, index) => {
            const rank = index + 1;
            const wins = teamStats.matchesWon || 0;
            const losses = teamStats.matchesPlayed - wins;
            const pointsScored = teamStats.pointsScored || 0;
            const pointsConceded = teamStats.pointsConceded || 0;
            const goalAverage = pointsScored - pointsConceded;
            const gaDisplay = goalAverage > 0 ? `+${goalAverage}` : goalAverage;

            return `
                <tr>
                    <td class="rank">${rank}</td>
                    <td class="team-name">${escapeHtml(teamStats.name)}</td>
                    <td>${wins}</td>
                    <td>${losses}</td>
                    <td>${pointsScored}</td>
                    <td>${pointsConceded}</td>
                    <td class="goal-average ${goalAverage >= 0 ? 'positive' : 'negative'}">${gaDisplay}</td>
                </tr>
            `;
        }).join('');

        return `
            <table class="ranking-table">
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    renderMatchesTable(matches, poolIndex) {
        if (!matches || matches.length === 0) {
            return '<p class="no-data">Aucun match dans cette poule</p>';
        }

        const rows = matches.map((match, matchIndex) => {
            const team1 = this.tournament.teams.get(match.team1Id);
            const team2 = this.tournament.teams.get(match.team2Id);
            const team1Name = team1 ? team1.name : 'Équipe inconnue';
            const team2Name = team2 ? team2.name : 'Équipe inconnue';

            const matchId = `pool-${poolIndex}-${matchIndex}`;
            const isEditing = this.editingMatchId === matchId;

            if (isEditing) {
                return this.renderEditingMatchRow(matchId, team1Name, team2Name, match, matchIndex, poolIndex);
            } else {
                return this.renderNormalMatchRow(matchId, team1Name, team2Name, match, matchIndex, poolIndex);
            }
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

    renderNormalMatchRow(matchId, team1Name, team2Name, match, matchIndex, poolIndex) {
        let scoreDisplay;
        let statusClass;
        let statusText;
        let actionButton;

        if (match.isPlayed) {
            scoreDisplay = `${match.score1} - ${match.score2}`;
            statusClass = 'status-played';
            statusText = 'Joué';
            actionButton = createButton('Modifier', `editPoolMatch('${matchId}')`, 'btn-secondary btn-small');
        } else {
            scoreDisplay = '- - -';
            statusClass = 'status-not-played';
            statusText = 'Non joué';
            actionButton = createButton('Saisir Score', `editPoolMatch('${matchId}')`, 'btn-primary btn-small');
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
    }

    renderEditingMatchRow(matchId, team1Name, team2Name, match, matchIndex, poolIndex) {
        const score1Value = match.score1 !== null ? match.score1 : '';
        const score2Value = match.score2 !== null ? match.score2 : '';

        return `
            <tr class="editing-row">
                <td>${escapeHtml(team1Name)}</td>
                <td class="score-edit">
                    <input type="number"
                           id="score1-${matchId}"
                           value="${score1Value}"
                           min="0"
                           class="score-input"
                           placeholder="0">
                    <span class="score-separator">-</span>
                    <input type="number"
                           id="score2-${matchId}"
                           value="${score2Value}"
                           min="0"
                           class="score-input"
                           placeholder="0">
                </td>
                <td>${escapeHtml(team2Name)}</td>
                <td class="status status-editing">En édition</td>
                <td class="actions">
                    ${createButton('Enregistrer', `savePoolMatch('${matchId}', ${matchIndex}, ${poolIndex})`, 'btn-primary btn-small')}
                    ${createButton('Annuler', `cancelEdit()`, 'btn-secondary btn-small')}
                </td>
            </tr>
        `;
    }

    renderQualificationSection() {
        return `
            <div class="qualification-section">
                <div class="success-message">
                    <strong>✓ Phase de poules terminée !</strong>
                    <p>Tous les matches de poule ont été joués. Vous pouvez maintenant passer à la phase éliminatoire.</p>
                </div>
                <div class="action-buttons">
                    ${createPrimaryButton('Passer aux Tableaux Finaux', 'startBracketPhase()')}
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Store reference to this view in the DOM for global functions
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent._poolPhaseView = this;
        }

        // Navigation buttons
        const homeBtn = document.querySelector('[data-action="goToHome"]');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                if (typeof router !== 'undefined') {
                    router.navigate('home');
                }
            });
        }

        const setupBtn = document.querySelector('[data-action="goToSetup"]');
        if (setupBtn) {
            setupBtn.addEventListener('click', () => {
                if (typeof router !== 'undefined') {
                    router.navigate('setup');
                }
            });
        }
    }

    switchPool(poolIndex) {
        if (poolIndex >= 0 && poolIndex < this.tournament.pools.length) {
            this.currentPoolIndex = poolIndex;
            this.editingMatchId = null;
            this.rerenderView();
        }
    }

    editPoolMatch(matchId) {
        this.editingMatchId = matchId;
        this.rerenderView();
    }

    cancelEdit() {
        this.editingMatchId = null;
        this.rerenderView();
    }

    savePoolMatch(matchId, matchIndex, poolIndex) {
        const score1Input = document.getElementById(`score1-${matchId}`);
        const score2Input = document.getElementById(`score2-${matchId}`);

        if (!score1Input || !score2Input) {
            alert('Erreur : impossible de trouver les champs de score');
            return;
        }

        const score1 = parseInt(score1Input.value);
        const score2 = parseInt(score2Input.value);

        // Validation
        if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
            alert('Veuillez saisir des scores valides (nombres entiers >= 0)');
            return;
        }

        // Get the match object
        const pool = this.tournament.pools[poolIndex];
        if (!pool) {
            alert('Erreur : poule introuvable');
            return;
        }

        const match = pool.matches[matchIndex];
        if (!match) {
            alert('Erreur : match introuvable');
            return;
        }

        // If match was already played, reset old stats
        if (match.isPlayed) {
            this.resetMatchStats(match);
        }

        // Set new score
        match.setScore(score1, score2);

        // Update team stats
        this.updateMatchStats(match);

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

    startBracketPhaseAction() {
        try {
            // Get qualified teams
            const qualifiedTeams = this.tournament.getQualifiedTeams();
            const expectedCount = this.tournament.qualifiedCount || 16;

            if (qualifiedTeams.length !== expectedCount) {
                alert(`Erreur : ${qualifiedTeams.length} équipes qualifiées au lieu de ${expectedCount} requises`);
                return;
            }

            // Start bracket phase
            const success = this.tournament.startBracketPhase();

            if (success) {
                // Save tournament
                if (typeof app !== 'undefined' && typeof app.setTournament === 'function') {
                    app.setTournament(this.tournament);
                } else {
                    this.tournament.save();
                }

                // Navigate to bracket view
                if (typeof router !== 'undefined') {
                    router.navigate('bracket');
                }
            } else {
                alert('Erreur : impossible de démarrer la phase éliminatoire');
            }
        } catch (error) {
            alert('Erreur : ' + error.message);
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
function switchPool(poolIndex) {
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent._poolPhaseView) {
        mainContent._poolPhaseView.switchPool(poolIndex);
    }
}

function editPoolMatch(matchId) {
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent._poolPhaseView) {
        mainContent._poolPhaseView.editPoolMatch(matchId);
    }
}

function cancelEdit() {
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent._poolPhaseView) {
        mainContent._poolPhaseView.cancelEdit();
    }
}

function savePoolMatch(matchId, matchIndex, poolIndex) {
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent._poolPhaseView) {
        mainContent._poolPhaseView.savePoolMatch(matchId, matchIndex, poolIndex);
    }
}

function startBracketPhase() {
    const mainContent = document.getElementById('main-content');
    if (mainContent && mainContent._poolPhaseView) {
        mainContent._poolPhaseView.startBracketPhaseAction();
    }
}

function goToHome() {
    if (typeof router !== 'undefined') {
        router.navigate('home');
    }
}

function goToSetup() {
    if (typeof router !== 'undefined') {
        router.navigate('setup');
    }
}

function goToMatchSheet() {
    if (typeof router !== 'undefined') {
        router.navigate('match-sheet');
    }
}
