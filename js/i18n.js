/**
 * Internationalization system for TaskToGo
 */
class I18n {
    constructor() {
        this.currentLanguage = this.detectLanguage();
        this.translations = {};
        this.loadTranslations();
    }

    /**
     * Detect user's preferred language
     */
    detectLanguage() {
        // Check localStorage first
        const savedLang = localStorage.getItem('taskToGo_language');
        if (savedLang && ['en', 'it'].includes(savedLang)) {
            return savedLang;
        }

        // Check browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('it')) {
            return 'it';
        }

        // Default to English
        return 'en';
    }

    /**
     * Load translations for current language
     */
    async loadTranslations() {
        try {
            const response = await fetch(`locales/${this.currentLanguage}.json`);
            this.translations = await response.json();
            this.updateUI();
        } catch (error) {
            console.error('Failed to load translations:', error);
            // Fallback to English if current language fails
            if (this.currentLanguage !== 'en') {
                this.currentLanguage = 'en';
                await this.loadTranslations();
            }
        }
    }

    /**
     * Get translated text by key
     */
    t(key, fallback = key) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return fallback;
            }
        }

        return typeof value === 'string' ? value : fallback;
    }

    /**
     * Change language
     */
    async setLanguage(language) {
        if (language === this.currentLanguage) return;

        this.currentLanguage = language;
        localStorage.setItem('taskToGo_language', language);
        await this.loadTranslations();
    }

    /**
     * Update UI with current translations
     */
    updateUI() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // Update language dropdown icon
        const currentLanguageIcon = document.getElementById('currentLanguageIcon');
        if (currentLanguageIcon) {
            const languageIcons = {
                'en': 'circle-flags:us',
                'it': 'circle-flags:it'
            };
            currentLanguageIcon.setAttribute('icon', languageIcons[this.currentLanguage] || 'circle-flags:us');
        }

        // Update document language
        document.documentElement.lang = this.currentLanguage;
    }

    /**
     * Get current language
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get available languages
     */
    getAvailableLanguages() {
        return [
            { code: 'en', name: 'English' },
            { code: 'it', name: 'Italiano' }
        ];
    }
}

// Initialize i18n system
const i18n = new I18n();