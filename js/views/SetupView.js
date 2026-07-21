/**
 * SetupView - Vue de création et configuration de tournoi
 * Gère les 4 étapes : accueil, création, saisie des équipes, organisation en poules
 */
class SetupView {
    constructor(tournament) {
        this.tournament = tournament;
        this.step = 'welcome'; // 'welcome', 'create', 'teams', 'pools', 'format'

        // Si un tournoi existe en phase setup, restaurer ses données
        if (tournament && tournament.phase === 'setup') {
            this.tempTournamentName = tournament.name || '';
            this.tempTeams = Array.from(tournament.teams.values()).map(t => t.name);
            this.tempQualifiedCount = tournament.qualifiedCount || 16;
            // Démarrer directement à l'étape de saisie des équipes
            this.step = 'teams';
        } else {
            this.tempTournamentName = '';
            this.tempTeams = [];
            this.tempQualifiedCount = 16;
        }

        this.tempPools = [];
    }

    /**
     * Retourne le HTML complet de la vue selon l'étape actuelle
     * @returns {string} HTML de la vue
     */
    render() {
        // Si un tournoi existe déjà et n'est pas en phase setup, rediriger
        if (this.tournament && this.tournament.phase !== 'setup') {
            this.step = 'welcome';
        }

        switch (this.step) {
            case 'welcome':
                return this.renderWelcome();
            case 'create':
                return this.renderCreate();
            case 'teams':
                return this.renderTeams();
            case 'format':
                return this.renderFormat();
            case 'pools':
                return this.renderPools();
            default:
                return this.renderWelcome();
        }
    }

    /**
     * Écran d'accueil
     * @returns {string} HTML de l'écran d'accueil
     */
    renderWelcome() {
        const existingTournament = Tournament.load();
        const hasExistingTournament = existingTournament !== null;

        let resumeButton = '';
        if (hasExistingTournament) {
            resumeButton = `
                <div class="welcome-action">
                    ${createSecondaryButton('Reprendre le tournoi', 'setupView.resumeTournament()')}
                    <p class="welcome-subtitle">Continuer le tournoi "${escapeHtml(existingTournament.name)}"</p>
                </div>
            `;
        }

        return `
            <div class="setup-view">
                <div class="welcome-screen">
                    <h2>Bienvenue au Tournoi de Coinche</h2>
                    <p class="welcome-description">
                        Organisez votre tournoi de coinche avec une phase de poules suivie d'une phase éliminatoire.
                        Le format s'adapte au nombre d'équipes participantes.
                    </p>

                    <div class="welcome-actions">
                        <div class="welcome-action">
                            ${createPrimaryButton('Nouveau Tournoi', 'setupView.startCreate()')}
                            <p class="welcome-subtitle">Créer un nouveau tournoi</p>
                        </div>
                        ${resumeButton}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Formulaire de création de tournoi
     * @returns {string} HTML du formulaire de création
     */
    renderCreate() {
        return `
            <div class="setup-view">
                <div class="setup-step">
                    <h2>Créer un nouveau tournoi</h2>

                    <form id="create-tournament-form" class="setup-form" onsubmit="setupView.handleCreateSubmit(event); return false;">
                        ${createTextInput('tournament-name', 'Nom du tournoi', 'Ex: Tournoi de Coinche 2026', this.tempTournamentName)}

                        <div class="form-actions">
                            ${createSecondaryButton('Retour', 'setupView.goToWelcome()')}
                            <button type="submit" class="btn-primary btn-submit">Suivant</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    /**
     * Saisie des équipes
     * @returns {string} HTML de la saisie des équipes
     */
    renderTeams() {
        const teamsEntered = this.tempTeams.length;

        let teamsList = '';
        if (this.tempTeams.length > 0) {
            teamsList = `
                <div class="teams-list">
                    <h3>Équipes saisies (${teamsEntered})</h3>
                    <ul class="teams-list-items">
                        ${this.tempTeams.map((team, index) => `
                            <li class="team-item">
                                <span class="team-name">${escapeHtml(team)}</span>
                                ${createDangerButton('✕', `setupView.removeTeam(${index})`, 'btn-small')}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }

        return `
            <div class="setup-view">
                <div class="setup-step">
                    <h2>Saisie des équipes</h2>
                    <p class="setup-subtitle">Tournoi : ${escapeHtml(this.tempTournamentName)}</p>

                    <div class="teams-counter">
                        <strong>${teamsEntered} équipes</strong> inscrites
                    </div>

                    ${teamsList}

                    <form id="add-team-form" class="setup-form" onsubmit="setupView.handleAddTeam(event); return false;">
                        ${createTextInput('team-name', 'Nom de l\'équipe', 'Ex: Les As de Pique', '')}

                        <div class="form-actions">
                            <button type="submit" class="btn-secondary btn-submit">Ajouter l'équipe</button>
                        </div>
                    </form>

                    <div class="form-actions setup-navigation">
                        ${createSecondaryButton('Retour', 'setupView.goToCreate()')}
                        ${createPrimaryButton('Choisir le Format', 'setupView.goToFormat()')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Choix du format de phase finale
     * @returns {string} HTML du choix du format
     */
    renderFormat() {
        const teamCount = this.tempTeams.length;
        const poolCount = Math.ceil(teamCount / 4);
        const maxQualified = Math.min(poolCount * 3, teamCount); // Max: 3 par poule

        // Calculer les options possibles
        const options = [];

        // Option 4 équipes (demi-finales) pour les petits tournois (8-14 équipes)
        if (teamCount >= 8 && teamCount <= 14) {
            let desc = '';
            if (teamCount === 8) {
                // 2 poules de 4
                desc = 'Les 2 premiers + 2 meilleurs seconds';
            } else if (teamCount === 10) {
                // 2 poules de 5
                desc = 'Les 2 premiers + 2 meilleurs seconds';
            } else if (teamCount === 12) {
                // 3 poules de 4
                desc = 'Les 3 premiers + meilleur second';
            } else if (teamCount === 14) {
                // 1 poule de 4 + 2 poules de 5
                desc = 'Les 3 premiers + meilleur second';
            }
            options.push({
                value: 4,
                label: '4 équipes - Demi-finales',
                description: desc
            });
        }

        // Option 8 équipes (quarts de finale)
        if (poolCount >= 3) {
            options.push({
                value: 8,
                label: '8 équipes - Quarts de finale',
                description: `Les ${Math.min(poolCount, 8)} premiers${poolCount >= 8 ? '' : ' + ' + (8 - poolCount) + ' meilleurs seconds'}`
            });
        }

        // Option 16 équipes (huitièmes de finale)
        if (poolCount >= 6 || (poolCount >= 4 && maxQualified >= 16)) {
            const needed = 16;
            let desc = '';
            if (poolCount >= 16) {
                desc = 'Les 16 premiers';
            } else if (poolCount >= 8) {
                desc = `Les ${poolCount} premiers + ${poolCount} seconds`;
            } else {
                desc = `Les ${poolCount} premiers + ${poolCount} seconds + ${needed - poolCount * 2} meilleurs troisièmes`;
            }
            options.push({
                value: 16,
                label: '16 équipes - Huitièmes de finale',
                description: desc
            });
        }

        // Option 32 équipes si assez d'équipes
        if (poolCount >= 11) {
            options.push({
                value: 32,
                label: '32 équipes - 1/16e de finale',
                description: 'Format étendu avec plus d\'équipes qualifiées'
            });
        }

        const optionsHtml = options.map(opt => `
            <div class="format-option ${this.tempQualifiedCount === opt.value ? 'selected' : ''}"
                 onclick="setupView.selectFormat(${opt.value})">
                <input type="radio" name="format" value="${opt.value}"
                       ${this.tempQualifiedCount === opt.value ? 'checked' : ''}>
                <div class="format-details">
                    <strong>${escapeHtml(opt.label)}</strong>
                    <p>${escapeHtml(opt.description)}</p>
                </div>
            </div>
        `).join('');

        return `
            <div class="setup-view">
                <div class="setup-step">
                    <h2>Format de la Phase Finale</h2>
                    <p class="setup-subtitle">Tournoi : ${escapeHtml(this.tempTournamentName)} - ${teamCount} équipes en ${poolCount} poules</p>

                    <div class="format-selection">
                        <p class="form-hint">Choisissez combien d'équipes se qualifieront pour la phase éliminatoire :</p>
                        ${optionsHtml}
                    </div>

                    <div class="form-actions setup-navigation">
                        ${createSecondaryButton('Retour', 'setupView.goToTeams()')}
                        ${createPrimaryButton('Suivant - Organisation des Poules', 'setupView.goToPools()')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Organisation en poules
     * @returns {string} HTML de l'organisation en poules
     */
    renderPools() {
        let poolsHtml = '';
        if (this.tempPools.length > 0) {
            poolsHtml = `
                <div class="pools-grid">
                    ${this.tempPools.map((pool, poolIndex) => `
                        <div class="pool-card">
                            <h3>Poule ${String.fromCharCode(65 + poolIndex)}</h3>
                            <ul class="pool-teams">
                                ${pool.map(teamName => `
                                    <li>${escapeHtml(teamName)}</li>
                                `).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            <div class="setup-view">
                <div class="setup-step">
                    <h2>Organisation en Poules</h2>
                    <p class="setup-subtitle">Tournoi : ${escapeHtml(this.tempTournamentName)} - ${this.tempTeams.length} équipes</p>

                    <div class="pools-info">
                        <p>
                            <strong>${this.tempPools.length} poules</strong> créées
                            ${this.tempPools.length > 0 ? `(${this.tempPools.map(p => p.length).join(', ')} équipes par poule)` : ''}
                        </p>
                    </div>

                    ${poolsHtml}

                    <div class="form-actions setup-navigation">
                        ${createSecondaryButton('Retour', 'setupView.goToTeams()')}
                        ${createSecondaryButton('Mélanger', 'setupView.shufflePools()')}
                        ${createPrimaryButton('Démarrer le Tournoi', 'setupView.startTournament()')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attache les écouteurs d'événements après le rendu
     */
    attachEventListeners() {
        // Les événements sont gérés via onclick dans le HTML
        // Cette méthode est appelée par convention mais n'est pas nécessaire ici
    }

    // ==================== Navigation entre les étapes ====================

    startCreate() {
        this.step = 'create';
        this.refreshView();
    }

    goToWelcome() {
        this.step = 'welcome';
        this.refreshView();
    }

    goToCreate() {
        this.step = 'create';
        this.refreshView();
    }

    goToTeams() {
        this.step = 'teams';
        this.refreshView();
    }

    goToFormat() {
        // Validation : le nombre d'équipes doit être pair
        if (this.tempTeams.length % 2 !== 0) {
            alert('Le nombre d\'équipes doit être pair');
            return;
        }

        this.step = 'format';
        this.refreshView();
    }

    selectFormat(count) {
        this.tempQualifiedCount = count;
        this.refreshView();
    }

    goToPools() {
        this.step = 'pools';

        // Générer les poules
        const poolSizes = this.calculatePoolSizes(this.tempTeams.length);
        this.tempPools = this.distributeIntoPoolsl(this.tempTeams, poolSizes);

        this.refreshView();
    }

    // ==================== Gestion de la création ====================

    handleCreateSubmit(event) {
        event.preventDefault();

        const nameInput = document.getElementById('tournament-name');
        const name = nameInput.value.trim();

        if (!name) {
            alert('Veuillez saisir un nom de tournoi');
            return;
        }

        this.tempTournamentName = name;
        this.tempTeams = [];

        // Créer et sauvegarder le tournoi immédiatement
        const tournament = new Tournament(this.tempTournamentName);
        app.setTournament(tournament);

        this.step = 'teams';
        this.refreshView();
    }

    // ==================== Gestion des équipes ====================

    handleAddTeam(event) {
        event.preventDefault();

        const input = document.getElementById('team-name');
        const teamName = input.value.trim();

        if (!teamName) {
            alert('Veuillez saisir un nom d\'équipe');
            return;
        }

        // Vérifier les doublons
        if (this.tempTeams.includes(teamName)) {
            alert('Cette équipe existe déjà');
            return;
        }

        this.tempTeams.push(teamName);

        // Ajouter l'équipe au tournoi et sauvegarder
        if (app.tournament) {
            app.tournament.addTeam(teamName);
            app.tournament.save();
        }

        input.value = '';
        this.refreshView();

        // Refocus sur l'input
        setTimeout(() => {
            const newInput = document.getElementById('team-name');
            if (newInput) newInput.focus();
        }, 0);
    }

    removeTeam(index) {
        if (index >= 0 && index < this.tempTeams.length) {
            this.tempTeams.splice(index, 1);

            // Recréer le tournoi depuis zéro avec les équipes restantes
            if (app.tournament) {
                const tournament = new Tournament(this.tempTournamentName);
                this.tempTeams.forEach(teamName => {
                    tournament.addTeam(teamName);
                });
                app.setTournament(tournament);
            }

            this.refreshView();
        }
    }

    // ==================== Organisation en poules ====================

    organizePools() {
        // Calculer la répartition optimale des poules
        const poolSizes = this.calculatePoolSizes(this.tempTeams.length);

        // Distribuer les équipes dans les poules
        this.tempPools = this.distributeIntoPoolsl(this.tempTeams, poolSizes);

        this.step = 'pools';
        this.refreshView();
    }

    /**
     * Calcule les tailles optimales des poules
     * Objectif : des poules de 4 ou 5 équipes
     * Si pas divisible par 4, créer des poules de 5 (minimum 2 poules de 5)
     * @param {number} teamCount - Nombre d'équipes
     * @returns {Array<number>} Tailles des poules (ex: [4, 4, 5, 5])
     */
    calculatePoolSizes(teamCount) {
        const poolSizes = [];

        // Contrainte : nombre minimum de poules selon le nombre d'équipes qualifiées
        // Pour 4 qualifiés : min 2 poules (2×1er + 2×2ème = 4)
        // Pour 8 qualifiés : min 3 poules (3×1er + 3×2ème + 2×3ème = 8)
        // Pour 16 qualifiés : min 6 poules (6×1er + 6×2ème + 4×3ème = 16)
        // Pour 32 qualifiés : min 11 poules (11×1er + 11×2ème + 10×3ème = 32)
        let minPools;
        if (this.tempQualifiedCount <= 4) {
            minPools = 2;
        } else if (this.tempQualifiedCount <= 8) {
            minPools = 3;
        } else if (this.tempQualifiedCount <= 16) {
            minPools = 6;
        } else {
            minPools = 11;
        }

        // Cas spéciaux
        if (teamCount % 4 === 0) {
            // Divisible par 4 : toutes les poules de 4
            const poolCount = teamCount / 4;
            for (let i = 0; i < poolCount; i++) {
                poolSizes.push(4);
            }
        } else {
            // Créer des poules de 5 pour absorber le reste (toujours un nombre pair)
            let fiveTeamPools = 0;
            let remaining = teamCount;

            if (teamCount % 4 === 1) {
                // 17, 21, 25, 29... → 2 poules de 5
                fiveTeamPools = 2;
                remaining -= 10;
            } else if (teamCount % 4 === 2) {
                // 18, 22, 26, 30... → 2 poules de 5
                fiveTeamPools = 2;
                remaining -= 10;
            } else if (teamCount % 4 === 3) {
                // 19, 23, 27, 31... → 4 poules de 5 (pas 3 car doit être pair!)
                fiveTeamPools = 4;
                remaining -= 20;
            }

            // Le reste en poules de 4
            const fourTeamPools = remaining / 4;

            for (let i = 0; i < fiveTeamPools; i++) {
                poolSizes.push(5);
            }
            for (let i = 0; i < fourTeamPools; i++) {
                poolSizes.push(4);
            }

            // Vérification : assez de poules pour le nombre d'équipes qualifiées choisi ?
            const totalPools = fourTeamPools + fiveTeamPools;
            if (totalPools < minPools) {
                throw new Error(`Avec ${teamCount} équipes, il faut au moins ${minPools} poules pour qualifier ${this.tempQualifiedCount} équipes. Choisissez un format avec moins de qualifiés ou ajoutez des équipes.`);
            }
        }

        return poolSizes;
    }

    /**
     * Distribue les équipes dans les poules selon les tailles données
     * @param {Array<string>} teams - Liste des noms d'équipes
     * @param {Array<number>} poolSizes - Tailles des poules
     * @returns {Array<Array<string>>} Poules avec équipes réparties
     */
    distributeIntoPoolsl(teams, poolSizes, shouldShuffle = false) {
        const teamsCopy = [...teams];

        // Mélanger seulement si demandé
        if (shouldShuffle) {
            this.shuffleArray(teamsCopy);
        }

        const pools = [];
        let teamIndex = 0;

        for (const size of poolSizes) {
            const pool = teamsCopy.slice(teamIndex, teamIndex + size);
            pools.push(pool);
            teamIndex += size;
        }

        return pools;
    }

    /**
     * Mélange un tableau en place (algorithme Fisher-Yates)
     * @param {Array} array - Tableau à mélanger
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    shufflePools() {
        if (this.tempPools.length === 0) {
            return;
        }

        // Récupérer toutes les équipes
        const allTeams = this.tempPools.flat();

        // Recalculer les tailles de poules
        const poolSizes = this.tempPools.map(pool => pool.length);

        // Redistribuer avec mélange
        this.tempPools = this.distributeIntoPoolsl(allTeams, poolSizes, true);

        this.refreshView();
    }

    // ==================== Finalisation ====================

    startTournament() {
        if (this.tempPools.length === 0) {
            alert('Aucune poule n\'a été créée');
            return;
        }

        // Créer le tournoi avec le nombre d'équipes qualifiées choisi
        const tournament = new Tournament(this.tempTournamentName, this.tempQualifiedCount);

        // Ajouter toutes les équipes
        const teamIds = [];
        this.tempTeams.forEach(teamName => {
            const team = tournament.addTeam(teamName);
            teamIds.push(team.id);
        });

        // Créer les poules avec les bonnes tailles
        const poolSizes = this.tempPools.map(pool => pool.length);
        tournament.createPools(poolSizes);

        // Réorganiser les équipes dans les poules selon tempPools
        // (car createPools utilise l'ordre d'ajout, pas notre répartition)
        this.tempPools.forEach((poolTeams, poolIndex) => {
            const pool = tournament.pools[poolIndex];
            pool.teams = [];

            poolTeams.forEach(teamName => {
                // Trouver l'ID de l'équipe par son nom
                for (const [id, team] of tournament.teams) {
                    if (team.name === teamName) {
                        pool.teams.push(id);
                        break;
                    }
                }
            });

            // Régénérer les matches avec la nouvelle répartition
            pool.generateMatches();
        });

        // Régénérer les matches inter-poules après la réorganisation
        tournament.generateInterPoolMatches();

        // Sauvegarder et rediriger
        if (typeof app !== 'undefined' && app.setTournament) {
            app.setTournament(tournament);
        } else {
            tournament.save();
        }

        // Rediriger vers la phase de poules
        if (typeof router !== 'undefined') {
            router.navigate('pool-phase');
        }
    }

    resumeTournament() {
        const tournament = Tournament.load();
        if (!tournament) {
            alert('Aucun tournoi à reprendre');
            return;
        }

        if (typeof app !== 'undefined' && app.setTournament) {
            app.setTournament(tournament);
        }

        // Rediriger selon la phase du tournoi
        if (typeof router !== 'undefined') {
            switch (tournament.phase) {
                case 'pool':
                    router.navigate('pool-phase');
                    break;
                case 'bracket':
                    router.navigate('bracket');
                    break;
                case 'finished':
                    router.navigate('bracket');
                    break;
                default:
                    router.navigate('home');
            }
        }
    }

    // ==================== Utilitaires ====================

    refreshView() {
        if (typeof app !== 'undefined' && app.renderView) {
            app.renderView(this);
        }
    }
}

// Global setupView is assigned by app.js when the view is rendered
