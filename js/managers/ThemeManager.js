/**
 * ThemeManager
 * Gère le thème clair/sombre de l'application
 */
class ThemeManager {
    constructor() {
        this.STORAGE_KEY = 'coinche_theme';
        this.THEMES = {
            LIGHT: 'light',
            DARK: 'dark',
            AUTO: 'auto'
        };

        this.init();
    }

    /**
     * Initialise le thème au chargement
     */
    init() {
        const savedTheme = this.getSavedTheme();
        this.applyTheme(savedTheme);
        this.createToggleButton();
        this.attachEventListeners();
    }

    /**
     * Récupère le thème sauvegardé
     * @returns {string} - 'light', 'dark' ou 'auto'
     */
    getSavedTheme() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        return saved || this.THEMES.AUTO;
    }

    /**
     * Sauvegarde le thème dans le localStorage
     * @param {string} theme - 'light', 'dark' ou 'auto'
     */
    saveTheme(theme) {
        localStorage.setItem(this.STORAGE_KEY, theme);
    }

    /**
     * Détermine le thème effectif à appliquer
     * @returns {string} - 'light' ou 'dark'
     */
    getEffectiveTheme() {
        const saved = this.getSavedTheme();

        if (saved === this.THEMES.AUTO) {
            // Utilise la préférence système
            return window.matchMedia('(prefers-color-scheme: dark)').matches
                ? this.THEMES.DARK
                : this.THEMES.LIGHT;
        }

        return saved;
    }

    /**
     * Applique le thème au document
     * @param {string} theme - 'light', 'dark' ou 'auto'
     */
    applyTheme(theme) {
        const effectiveTheme = theme === this.THEMES.AUTO
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? this.THEMES.DARK : this.THEMES.LIGHT)
            : theme;

        const html = document.documentElement;
        html.setAttribute('data-theme', effectiveTheme);

        // Met à jour l'icône du bouton
        this.updateToggleIcon(effectiveTheme);
    }

    /**
     * Bascule entre les thèmes
     */
    toggleTheme() {
        const currentEffective = this.getEffectiveTheme();
        const newTheme = currentEffective === this.THEMES.LIGHT
            ? this.THEMES.DARK
            : this.THEMES.LIGHT;

        this.saveTheme(newTheme);
        this.applyTheme(newTheme);
    }

    /**
     * Met à jour l'icône du bouton de toggle
     * @param {string} theme - 'light' ou 'dark'
     */
    updateToggleIcon(theme) {
        const button = document.getElementById('theme-toggle');
        if (!button) return;

        const icon = button.querySelector('.theme-toggle-icon');
        if (!icon) return;

        // 🌙 pour le mode sombre, ☀️ pour le mode clair
        icon.textContent = theme === this.THEMES.DARK ? '☀️' : '🌙';

        // Met à jour l'attribut aria-label pour l'accessibilité
        button.setAttribute('aria-label',
            theme === this.THEMES.DARK
                ? 'Activer le thème clair'
                : 'Activer le thème sombre'
        );
    }

    /**
     * Crée le bouton de toggle dans le DOM
     */
    createToggleButton() {
        // Vérifie si le bouton existe déjà
        if (document.getElementById('theme-toggle')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.type = 'button';
        button.setAttribute('aria-label', 'Changer de thème');

        const icon = document.createElement('span');
        icon.className = 'theme-toggle-icon';
        icon.textContent = '🌙';

        button.appendChild(icon);
        document.body.appendChild(button);
    }

    /**
     * Attache les event listeners
     */
    attachEventListeners() {
        // Écoute les changements de préférence système
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const saved = this.getSavedTheme();
            if (saved === this.THEMES.AUTO) {
                this.applyTheme(this.THEMES.AUTO);
            }
        });

        // Écoute le clic sur le bouton de toggle
        document.addEventListener('click', (e) => {
            if (e.target.closest('#theme-toggle')) {
                this.toggleTheme();
            }
        });
    }

    /**
     * Définit un thème spécifique
     * @param {string} theme - 'light', 'dark' ou 'auto'
     */
    setTheme(theme) {
        if (!Object.values(this.THEMES).includes(theme)) {
            console.warn(`Thème invalide: ${theme}`);
            return;
        }

        this.saveTheme(theme);
        this.applyTheme(theme);
    }

    /**
     * Retourne le thème actuel
     * @returns {string} - 'light' ou 'dark'
     */
    getCurrentTheme() {
        return this.getEffectiveTheme();
    }
}

// Export pour utilisation dans app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
