// Main application entry point
class App {
    constructor() {
        this.tournament = null;
        this.themeManager = null;
        this.init();
    }

    init() {
        // Initialize theme manager
        this.themeManager = new ThemeManager();

        // Load tournament from storage if exists
        const savedTournament = StorageManager.loadTournament();
        if (savedTournament) {
            this.tournament = Tournament.fromJSON(savedTournament);
        }

        // Setup global click handler for data-action buttons
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button) {
                e.preventDefault();
                e.stopPropagation();
                const action = button.getAttribute('data-action');
                console.log('Action clicked:', action);
                if (action) {
                    // Evaluate and execute action as JavaScript code
                    try {
                        // WARNING: Uses Function constructor - only use with trusted content
                        const fn = new Function(action);
                        fn.call(window);
                        console.log('Action executed successfully');
                    } catch (err) {
                        console.error('Error executing action:', action, err);
                    }
                }
            }
        });

        // Register routes
        router.register('home', () => this.renderHome());
        router.register('setup', () => this.renderSetup());
        router.register('pool-phase', () => this.renderPoolPhase());
        router.register('bracket', () => this.renderBracket());
        router.register('correction', () => this.renderCorrection());
        router.register('match-sheet', () => this.renderMatchSheet());

        // Start routing
        router.handleRoute();
    }

    renderHome() {
        const view = new HomeView(this.tournament);
        this.renderView(view);
        this.updateNav();
    }

    renderSetup() {
        const view = new SetupView(this.tournament);
        window.setupView = view; // Expose globally for data-action handlers
        this.renderView(view);
        this.updateNav();
    }

    renderPoolPhase() {
        if (!this.tournament || this.tournament.phase !== 'pool' || !this.tournament.pools || this.tournament.pools.length === 0) {
            router.navigate('setup');
            return;
        }
        const view = new PoolPhaseView(this.tournament);
        window.poolPhaseView = view; // Expose globally for data-action handlers
        this.renderView(view);
        this.updateNav();
    }

    renderBracket() {
        if (!this.tournament || this.tournament.phase !== 'bracket' || !this.tournament.bracket) {
            router.navigate('pool-phase');
            return;
        }
        const view = new BracketView(this.tournament);
        window.bracketView = view; // Expose globally for data-action handlers
        this.renderView(view);
        this.updateNav();
    }

    renderCorrection() {
        if (!this.tournament) {
            router.navigate('home');
            return;
        }
        const view = new CorrectionView(this.tournament);
        window.correctionView = view; // Expose globally for data-action handlers
        this.renderView(view);
        this.updateNav();
    }

    renderMatchSheet() {
        if (!this.tournament) {
            router.navigate('home');
            return;
        }
        const view = new MatchSheetView(this.tournament);
        window.matchSheetView = view; // Expose globally for data-action handlers
        this.renderView(view);
        this.updateNav();
    }

    renderView(view) {
        const mainContent = document.getElementById('main-content');

        // Clear existing content
        while (mainContent.firstChild) {
            mainContent.removeChild(mainContent.firstChild);
        }

        // Create a temporary container to parse the HTML
        const temp = document.createElement('div');
        temp.innerHTML = view.render();

        // Move all nodes from temp to mainContent
        while (temp.firstChild) {
            mainContent.appendChild(temp.firstChild);
        }

        // Attach event listeners after DOM is ready
        view.attachEventListeners();
    }

    updateNav() {
        const nav = document.getElementById('main-nav');

        // Clear existing nav
        while (nav.firstChild) {
            nav.removeChild(nav.firstChild);
        }

        // Create home link
        const homeLink = document.createElement('a');
        homeLink.href = '#home';
        homeLink.textContent = 'Accueil';
        nav.appendChild(homeLink);

        if (this.tournament) {
            // Feuille de matches - disponible en phase pool et bracket
            if (this.tournament.phase === 'pool' || this.tournament.phase === 'bracket') {
                const matchSheetLink = document.createElement('a');
                matchSheetLink.href = '#match-sheet';
                matchSheetLink.textContent = 'Feuille de Matches';
                nav.appendChild(document.createTextNode(' | '));
                nav.appendChild(matchSheetLink);
            }

            // Tableaux finaux - disponible en phase bracket et finished
            if (this.tournament.phase === 'bracket' || this.tournament.phase === 'finished') {
                const bracketLink = document.createElement('a');
                bracketLink.href = '#bracket';
                bracketLink.textContent = 'Tableaux Finaux';
                nav.appendChild(document.createTextNode(' | '));
                nav.appendChild(bracketLink);
            }

            // Correction - disponible dès que les poules existent
            if (this.tournament.pools && this.tournament.pools.length > 0) {
                const correctionLink = document.createElement('a');
                correctionLink.href = '#correction';
                correctionLink.textContent = 'Corriger Scores';
                nav.appendChild(document.createTextNode(' | '));
                nav.appendChild(correctionLink);
            }
        }
    }

    setTournament(tournament) {
        this.tournament = tournament;
        StorageManager.saveTournament(tournament);
        this.updateNav();
    }

    deleteTournament() {
        this.tournament = null;
        StorageManager.deleteTournament();
        this.updateNav();
    }
}

// Global app instance
const app = new App();
