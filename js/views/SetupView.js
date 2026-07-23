/**
 * SetupView - Vue de création et configuration de tournoi
 * Gère le flux en 6 étapes : welcome → create → teams → pool-count → format → pools
 */
class SetupView {
    constructor(tournament) {
        this.tournament = tournament;
        this.step = 'welcome'; // 'welcome', 'create', 'teams', 'pool-count', 'format', 'pools'

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
        this.tempPoolCount = null;
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
            case 'pool-count':
                return this.renderPoolCount();
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
                        ${createPrimaryButton('Nombre de Poules', 'setupView.goToPoolCount()')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Choix du format de phase finale (nombre d'équipes qualifiées)
     * Étape 4 du flux : après le choix du nombre de poules, avant l'organisation
     * @returns {string} HTML du choix du format
     */
    renderFormat() {
        const teamCount = this.tempTeams.length;
        const poolCount = this.tempPoolCount;

        // Calculer les options possibles selon le nombre de poules
        const options = [];

        // Option 4 équipes (demi-finales)
        if (poolCount >= 2) {
            let desc = this.getQualificationDescription(poolCount, 4);
            options.push({
                value: 4,
                label: '4 équipes - Demi-finales',
                description: desc
            });
        }

        // Option 8 équipes (quarts de finale)
        if (poolCount >= 3) {
            let desc = this.getQualificationDescription(poolCount, 8);
            options.push({
                value: 8,
                label: '8 équipes - Quarts de finale',
                description: desc
            });
        }

        // Option 16 équipes (huitièmes de finale)
        if (poolCount >= 6) {
            let desc = this.getQualificationDescription(poolCount, 16);
            options.push({
                value: 16,
                label: '16 équipes - Huitièmes de finale',
                description: desc
            });
        }

        // Option 32 équipes
        if (poolCount >= 11) {
            let desc = this.getQualificationDescription(poolCount, 32);
            options.push({
                value: 32,
                label: '32 équipes - 1/16e de finale',
                description: desc
            });
        }

        // Sélectionner par défaut la première option si aucune n'est sélectionnée
        if (this.tempQualifiedCount === null && options.length > 0) {
            this.tempQualifiedCount = options[0].value;
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
                        ${createSecondaryButton('Retour', 'setupView.goToPoolCount()')}
                        ${createPrimaryButton('Suivant - Organisation des Poules', 'setupView.goToPools()')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Génère la description de la qualification selon le nombre de poules
     * @param {number} poolCount - Nombre de poules
     * @param {number} qualifiedCount - Nombre d'équipes qualifiées
     * @returns {string} Description de la qualification
     */
    getQualificationDescription(poolCount, qualifiedCount) {
        if (qualifiedCount <= poolCount) {
            // Seulement les premiers de poule
            return `Les ${qualifiedCount} premiers`;
        } else if (qualifiedCount <= poolCount * 2) {
            // Premiers + seconds
            const secondsNeeded = qualifiedCount - poolCount;
            if (secondsNeeded === poolCount) {
                return `Les ${poolCount} premiers + ${poolCount} seconds`;
            } else {
                return `Les ${poolCount} premiers + ${secondsNeeded} meilleurs seconds`;
            }
        } else if (qualifiedCount <= poolCount * 3) {
            // Premiers + seconds + troisièmes
            const thirdsNeeded = qualifiedCount - poolCount * 2;
            if (thirdsNeeded === poolCount) {
                return `Les ${poolCount} premiers + ${poolCount} seconds + ${poolCount} troisièmes`;
            } else {
                return `Les ${poolCount} premiers + ${poolCount} seconds + ${thirdsNeeded} meilleurs troisièmes`;
            }
        } else {
            return `Les ${qualifiedCount} meilleures équipes`;
        }
    }

    /**
     * Choix du nombre de poules
     * Étape 3 du flux : après la saisie des équipes, avant le choix du format
     * @returns {string} HTML du choix du nombre de poules
     */
    renderPoolCount() {
        const teamCount = this.tempTeams.length;

        const options = [];

        // Calculer les options valides
        // Le nombre de poules peut varier selon la contrainte des poules de 4 ou 5
        const minPools = 2; // Minimum 2 poules
        const maxPools = Math.floor(teamCount / 4);

        for (let poolCount = minPools; poolCount <= maxPools; poolCount++) {
            const distribution = this.calculateDistribution(teamCount, poolCount);
            if (distribution) {
                options.push({
                    count: poolCount,
                    distribution: distribution
                });
            }
        }

        // Sélectionner par défaut l'option du milieu ou la première si tempPoolCount n'est pas défini
        if (this.tempPoolCount === null && options.length > 0) {
            this.tempPoolCount = options[Math.floor(options.length / 2)].count;
        }

        const optionsHtml = options.map(opt => {
            const isSelected = this.tempPoolCount === opt.count;
            return `
                <div class="format-option ${isSelected ? 'selected' : ''}"
                     onclick="setupView.selectPoolCount(${opt.count})">
                    <input type="radio" name="pool-count" value="${opt.count}"
                           ${isSelected ? 'checked' : ''}>
                    <div class="format-details">
                        <strong>${opt.count} poules</strong>
                        <p>${escapeHtml(opt.distribution)}</p>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="setup-view">
                <div class="setup-step">
                    <h2>Choisir le nombre de poules</h2>
                    <p class="setup-subtitle">Tournoi : ${escapeHtml(this.tempTournamentName)} - ${teamCount} équipes</p>

                    <div class="format-selection">
                        <p class="form-hint">Choisissez comment organiser vos équipes en poules :</p>
                        ${optionsHtml}
                    </div>

                    <div class="form-actions setup-navigation">
                        ${createSecondaryButton('Retour', 'setupView.goToTeams()')}
                        ${createPrimaryButton('Suivant - Format de Qualification', 'setupView.goToFormat()')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Organisation en poules (affichage et mélange)
     * Étape finale du flux : affiche la répartition calculée, permet de mélanger et de démarrer
     * @returns {string} HTML de l'organisation en poules
     */
    renderPools() {
        // Calculer les statistiques
        const poolSizes = this.tempPools.map(p => p.length);
        const uniqueSizes = [...new Set(poolSizes)];
        const poolsOf4 = poolSizes.filter(s => s === 4).length;
        const poolsOf5 = poolSizes.filter(s => s === 5).length;

        let distributionText = '';
        if (poolsOf4 > 0 && poolsOf5 > 0) {
            distributionText = `${poolsOf4} poules de 4 équipes + ${poolsOf5} poules de 5 équipes`;
        } else if (poolsOf4 > 0) {
            distributionText = `${poolsOf4} poules de 4 équipes`;
        } else if (poolsOf5 > 0) {
            distributionText = `${poolsOf5} poules de 5 équipes`;
        }

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
                    <p class="setup-subtitle">Tournoi : ${escapeHtml(this.tempTournamentName)}</p>

                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-value">${this.tempTeams.length}</div>
                            <div class="stat-label">Équipes</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.tempPools.length}</div>
                            <div class="stat-label">Poules</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${this.tempQualifiedCount}</div>
                            <div class="stat-label">Qualifiés</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${uniqueSizes.join('-')}</div>
                            <div class="stat-label">Taille</div>
                        </div>
                    </div>

                    <div class="pools-info">
                        <p>${distributionText}</p>
                    </div>

                    ${poolsHtml}

                    <div class="info-message">
                        💡 Vous pouvez mélanger les équipes pour varier la composition des poules
                    </div>

                    <div class="form-actions setup-navigation">
                        ${createSecondaryButton('Retour', 'setupView.goToFormat()')}
                        ${createSecondaryButton('🔀 Mélanger', 'setupView.shufflePools()')}
                        ${createPrimaryButton('🚀 Démarrer le Tournoi', 'setupView.startTournament()')}
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
    // Flux : welcome → create → teams → pool-count → format → pools → start

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

    /**
     * Navigation vers l'étape de choix du format
     * Valide qu'un nombre de poules a été choisi
     */
    goToFormat() {
        if (this.tempPoolCount === null) {
            alert('Veuillez choisir un nombre de poules');
            return;
        }

        this.step = 'format';
        this.refreshView();
    }

    /**
     * Sélectionne un format de qualification (nombre d'équipes qualifiées)
     * @param {number} count - Nombre d'équipes qualifiées (4, 8, 16 ou 32)
     */
    selectFormat(count) {
        this.tempQualifiedCount = count;
        this.refreshView();
    }

    /**
     * Navigation vers l'étape de choix du nombre de poules
     * Valide que le nombre d'équipes est pair
     */
    goToPoolCount() {
        if (this.tempTeams.length % 2 !== 0) {
            alert('Le nombre d\'équipes doit être pair');
            return;
        }

        this.step = 'pool-count';
        this.refreshView();
    }

    /**
     * Sélectionne un nombre de poules
     * @param {number} count - Nombre de poules
     */
    selectPoolCount(count) {
        this.tempPoolCount = count;
        this.refreshView();
    }

    /**
     * Navigation vers l'étape d'organisation des poules
     * Valide qu'un format a été choisi et génère la répartition
     */
    goToPools() {
        if (this.tempQualifiedCount === null) {
            alert('Veuillez choisir un format de qualification');
            return;
        }

        this.step = 'pools';

        // Générer les poules selon le nombre choisi
        const poolSizes = this.calculatePoolSizes(this.tempTeams.length);
        this.tempPools = this.distributeIntoPoolsl(this.tempTeams, poolSizes);

        this.refreshView();
    }

    // ==================== Gestion de la création ====================

    /**
     * Gère la soumission du formulaire de création de tournoi
     * Crée et sauvegarde le tournoi, puis passe à l'étape de saisie des équipes
     * @param {Event} event - Événement de soumission du formulaire
     */
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

    /**
     * Gère l'ajout d'une équipe au tournoi
     * Valide les doublons et sauvegarde le tournoi
     * @param {Event} event - Événement de soumission du formulaire
     */
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

    /**
     * Supprime une équipe du tournoi
     * Recrée le tournoi depuis zéro avec les équipes restantes
     * @param {number} index - Index de l'équipe à supprimer
     */
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

    /**
     * OBSOLETE : remplacée par le flux pool-count → format → pools
     * Conservée pour rétrocompatibilité mais non utilisée dans le flux actuel
     */
    organizePools() {
        const poolSizes = this.calculatePoolSizes(this.tempTeams.length);
        this.tempPools = this.distributeIntoPoolsl(this.tempTeams, poolSizes);

        this.step = 'pools';
        this.refreshView();
    }

    /**
     * Retourne le nombre minimum de poules nécessaire pour le nombre de qualifiés
     * @param {number} qualifiedCount - Nombre d'équipes qualifiées
     * @returns {number} Nombre minimum de poules
     */
    getMinPoolsForQualified(qualifiedCount) {
        if (qualifiedCount <= 4) {
            return 2;
        } else if (qualifiedCount <= 8) {
            return 3;
        } else if (qualifiedCount <= 16) {
            return 6;
        } else {
            return 11;
        }
    }

    /**
     * Calcule la distribution des équipes dans les poules
     * @param {number} teamCount - Nombre d'équipes
     * @param {number} poolCount - Nombre de poules
     * @returns {string|null} Description de la distribution ou null si invalide
     */
    calculateDistribution(teamCount, poolCount) {
        const poolSizes = this.calculatePoolSizesForCount(teamCount, poolCount);
        if (!poolSizes) return null;

        const count4 = poolSizes.filter(s => s === 4).length;
        const count5 = poolSizes.filter(s => s === 5).length;

        let description = '';
        if (count4 > 0 && count5 > 0) {
            description = `${count4} poules de 4 + ${count5} poules de 5`;
        } else if (count4 > 0) {
            description = `${count4} poules de 4`;
        } else {
            description = `${count5} poules de 5`;
        }

        return description;
    }

    /**
     * Génère l'array de tailles de poules pour un nombre de poules donné
     * @param {number} teamCount - Nombre d'équipes
     * @param {number} poolCount - Nombre de poules
     * @returns {Array<number>|null} Tailles des poules ou null si invalide
     */
    calculatePoolSizesForCount(teamCount, poolCount) {
        const avgSize = teamCount / poolCount;

        // Vérifier que la taille moyenne est entre 4 et 5
        if (avgSize < 4 || avgSize > 5) return null;

        // Calculer le nombre de poules de 5 et de 4
        const fiveCount = teamCount - (poolCount * 4);
        const fourCount = poolCount - fiveCount;

        // Vérifier que fiveCount est valide (0 ou pair)
        if (fiveCount < 0 || (fiveCount > 0 && fiveCount % 2 !== 0)) return null;

        const poolSizes = [];
        for (let i = 0; i < fiveCount; i++) {
            poolSizes.push(5);
        }
        for (let i = 0; i < fourCount; i++) {
            poolSizes.push(4);
        }

        return poolSizes;
    }

    /**
     * Calcule les tailles optimales des poules
     * Utilise tempPoolCount si défini, sinon calcule automatiquement (mode legacy)
     * @param {number} teamCount - Nombre d'équipes
     * @returns {Array<number>} Tailles des poules (ex: [5, 5, 4, 4])
     */
    calculatePoolSizes(teamCount) {
        // Si un nombre de poules a été choisi (flux normal), l'utiliser
        if (this.tempPoolCount !== null) {
            return this.calculatePoolSizesForCount(teamCount, this.tempPoolCount);
        }

        // Mode legacy : calcul automatique basé sur tempQualifiedCount
        // Non utilisé dans le flux actuel mais conservé pour rétrocompatibilité
        const poolSizes = [];

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

        if (teamCount % 4 === 0) {
            const poolCount = teamCount / 4;
            for (let i = 0; i < poolCount; i++) {
                poolSizes.push(4);
            }
        } else {
            let fiveTeamPools = 0;
            let remaining = teamCount;

            if (teamCount % 4 === 1) {
                fiveTeamPools = 2;
                remaining -= 10;
            } else if (teamCount % 4 === 2) {
                fiveTeamPools = 2;
                remaining -= 10;
            } else if (teamCount % 4 === 3) {
                fiveTeamPools = 4;
                remaining -= 20;
            }

            const fourTeamPools = remaining / 4;

            for (let i = 0; i < fiveTeamPools; i++) {
                poolSizes.push(5);
            }
            for (let i = 0; i < fourTeamPools; i++) {
                poolSizes.push(4);
            }

            const totalPools = fourTeamPools + fiveTeamPools;
            if (totalPools < minPools) {
                throw new Error(`Avec ${teamCount} équipes, il faut au moins ${minPools} poules pour qualifier ${this.tempQualifiedCount} équipes.`);
            }
        }

        return poolSizes;
    }

    /**
     * Distribue les équipes dans les poules selon les tailles données
     * @param {Array<string>} teams - Liste des noms d'équipes
     * @param {Array<number>} poolSizes - Tailles des poules (ex: [5, 5, 4, 4])
     * @param {boolean} shouldShuffle - Si true, mélange les équipes avant distribution
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

    /**
     * Mélange les équipes entre les poules en conservant les tailles
     * Redistribue toutes les équipes aléatoirement
     */
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

    /**
     * Finalise la configuration et démarre le tournoi
     * Crée le tournoi avec toutes les équipes et poules, puis redirige vers la phase de poules
     */
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

    /**
     * Reprend un tournoi existant depuis le localStorage
     * Redirige vers la phase appropriée selon l'état du tournoi
     */
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

    /**
     * Déclenche un nouveau rendu de la vue en conservant l'état local
     */
    refreshView() {
        if (typeof app !== 'undefined' && app.renderView) {
            app.renderView(this);
        }
    }
}

// Global setupView is assigned by app.js when the view is rendered
