// Home view - Landing page for the tournament application
class HomeView {
    constructor(tournament) {
        this.tournament = tournament;
    }

    render() {
        // Helper to escape HTML
        const escapeHtml = (str) => {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        if (!this.tournament) {
            // No active tournament - show welcome screen
            return `
                <div class="home-container">
                    <div class="welcome-card">
                        <h2>Bienvenue au Gestionnaire de Tournoi de Coinche</h2>
                        <p>Organisez et gérez votre tournoi de coinche avec des phases de poules et des tableaux éliminatoires.</p>

                        <div class="features">
                            <div class="feature">
                                <span class="feature-icon">👥</span>
                                <h3>Gestion des Équipes</h3>
                                <p>Inscrivez les équipes et organisez-les en poules</p>
                            </div>
                            <div class="feature">
                                <span class="feature-icon">🏆</span>
                                <h3>Phase de Poules</h3>
                                <p>Matches de poule avec classement automatique</p>
                            </div>
                            <div class="feature">
                                <span class="feature-icon">🎯</span>
                                <h3>Phase Éliminatoire</h3>
                                <p>Tableau final des 16 meilleures équipes</p>
                            </div>
                            <div class="feature">
                                <span class="feature-icon">💾</span>
                                <h3>Sauvegarde Auto</h3>
                                <p>Progression sauvegardée automatiquement</p>
                            </div>
                        </div>

                        <div class="action-buttons">
                            ${createPrimaryButton('Créer un Nouveau Tournoi', 'router.navigate(\'setup\')')}
                            ${createSecondaryButton('Importer un Tournoi', 'importTournament()')}
                        </div>
                    </div>
                </div>
            `;
        }

        // Active tournament exists - show tournament dashboard
        const stats = this.getTournamentStats();
        const phase = this.getPhaseLabel(this.tournament.phase);

        return `
            <div class="home-container">
                <div class="tournament-dashboard">
                    <h2>${escapeHtml(this.tournament.name)}</h2>

                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalTeams}</div>
                            <div class="stat-label">Équipes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${phase}</div>
                            <div class="stat-label">Phase Actuelle</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.matchesPlayed}/${stats.totalMatches}</div>
                            <div class="stat-label">Matches Joués</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.progress}%</div>
                            <div class="stat-label">Progression</div>
                        </div>
                    </div>

                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${stats.progress}%"></div>
                    </div>

                    <div class="action-buttons">
                        ${this.getNextActionButton()}
                        ${createSecondaryButton('Exporter le Tournoi', 'exportTournament()')}
                        ${createSecondaryButton('Corriger des Scores', 'router.navigate(\'correction\')')}
                        ${createDangerButton('Supprimer le Tournoi', 'confirmDeleteTournament()')}
                    </div>
                </div>
            </div>
        `;
    }

    getTournamentStats() {
        const totalTeams = this.tournament.teams.size;
        let matchesPlayed = 0;
        let totalMatches = 0;

        // Count pool matches
        if (this.tournament.pools && this.tournament.pools.length > 0) {
            this.tournament.pools.forEach(pool => {
                totalMatches += pool.matches.length;
                matchesPlayed += pool.matches.filter(m => m.isPlayed).length;
            });
        }

        // Count bracket matches
        if (this.tournament.bracket && this.tournament.bracket.rounds) {
            this.tournament.bracket.rounds.forEach(round => {
                totalMatches += round.length;
                matchesPlayed += round.filter(m => m.isPlayed).length;
            });
        }

        const progress = totalMatches > 0 ? Math.round((matchesPlayed / totalMatches) * 100) : 0;

        return {
            totalTeams,
            matchesPlayed,
            totalMatches,
            progress
        };
    }

    getPhaseLabel(phase) {
        const labels = {
            'setup': 'Configuration',
            'pool': 'Phase de Poules',
            'bracket': 'Phase Éliminatoire',
            'finished': 'Terminé'
        };
        return labels[phase] || phase;
    }

    getNextActionButton() {
        switch (this.tournament.phase) {
            case 'setup':
                return createPrimaryButton('Continuer la Configuration', 'router.navigate(\'setup\')');
            case 'pool':
                return createPrimaryButton('Continuer la Phase de Poules', 'router.navigate(\'pool-phase\')');
            case 'bracket':
                return createPrimaryButton('Continuer la Phase Éliminatoire', 'router.navigate(\'bracket\')');
            case 'finished':
                return createPrimaryButton('Voir les Résultats', 'router.navigate(\'bracket\')');
            default:
                return createPrimaryButton('Continuer', 'router.navigate(\'setup\')');
        }
    }

    attachEventListeners() {
        // Event listeners are now handled by global click handler in app.js
        // No additional listeners needed
    }
}

// Global function for delete confirmation
function confirmDeleteTournament() {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible.')) {
        app.deleteTournament();
        app.renderHome(); // Force rerender
    }
}

// Global function for exporting tournament
function exportTournament() {
    if (!app.tournament) {
        alert('Aucun tournoi à exporter');
        return;
    }
    try {
        const json = JSON.stringify(app.tournament.toJSON(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `tournoi-${app.tournament.name.replace(/[^a-z0-9]/gi, '_')}-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        alert('Erreur lors de l\'export : ' + err.message);
    }
}

// Global function for importing tournament
function importTournament() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const tournament = Tournament.fromJSON(json);

                // Confirm if there's already a tournament
                if (app.tournament) {
                    if (!confirm('Un tournoi est déjà en cours. Voulez-vous le remplacer par le tournoi importé ?')) {
                        return;
                    }
                }

                app.setTournament(tournament);
                app.renderHome();
                alert('Tournoi importé avec succès !');
            } catch (err) {
                alert('Erreur lors de l\'import : ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
