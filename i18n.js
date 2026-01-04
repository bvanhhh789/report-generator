/**
 * i18n (Internationalization) Module
 * Handles language loading, switching, and text translation
 */

class I18n {
    constructor() {
        this.currentLang = null;
        this.translations = {};
        this.supportedLanguages = ['vi', 'en', 'cn', 'ko', 'ja', 'de', 'es', 'th'];
        this.defaultLanguage = 'vi';
    }

    /**
     * Initialize the i18n system
     */
    async init() {
        // Load saved language or default to Vietnamese
        const savedLang = localStorage.getItem('language');

        // Always default to Vietnamese unless user has explicitly chosen a language
        let initialLang = this.defaultLanguage; // Always Vietnamese
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            initialLang = savedLang;
        }

        await this.loadLanguage(initialLang);
        this.setupLanguageSwitcher();
        this.observeThemeChanges();
    }

    /**
     * Hook into theme toggle to update text
     */
    observeThemeChanges() {
        // Watch for theme attribute changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    this.updateThemeToggleText();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    /**
     * Load a language file
     */
    async loadLanguage(langCode) {
        try {
            const response = await fetch(`./lang/${langCode}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load language: ${langCode}`);
            }

            this.translations = await response.json();
            this.currentLang = langCode;
            localStorage.setItem('language', langCode);

            this.applyTranslations();
            this.updateLanguageSwitcher();

            // Update HTML lang attribute
            document.documentElement.setAttribute('lang', langCode);
        } catch (error) {
            console.error('Error loading language:', error);
            // Fallback to default language if loading fails
            if (langCode !== this.defaultLanguage) {
                await this.loadLanguage(this.defaultLanguage);
            }
        }
    }

    /**
     * Apply translations to all elements with data-i18n attribute
     */
    applyTranslations() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);

            if (translation) {
                // Handle different element types
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.hasAttribute('placeholder')) {
                        element.placeholder = translation;
                    }
                } else {
                    element.textContent = translation;
                }
            }
        });

        // Update page title
        const pageTitle = this.getTranslation('header.pageTitle');
        if (pageTitle) {
            document.title = pageTitle;
        }

        // Update theme toggle text
        this.updateThemeToggleText();
    }

    /**
     * Get translation by key (supports nested keys like 'header.title')
     */
    getTranslation(key) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }

        return value;
    }

    /**
     * Update theme toggle text based on current theme
     */
    updateThemeToggleText() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const themeText = document.getElementById('themeText');

        if (themeText) {
            const text = currentTheme === 'light'
                ? this.getTranslation('navbar.themeLight')
                : this.getTranslation('navbar.themeDark');
            themeText.textContent = text;
        }
    }

    /**
     * Setup language switcher dropdown
     */
    setupLanguageSwitcher() {
        const languageBtn = document.getElementById('languageBtn');
        const languageDropdown = document.getElementById('languageDropdown');

        if (!languageBtn || !languageDropdown) return;

        // Toggle dropdown on button click
        languageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            languageDropdown.classList.remove('active');
        });

        // Prevent dropdown from closing when clicking inside it
        languageDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Setup language option click handlers
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', async () => {
                const langCode = option.getAttribute('data-lang');
                await this.loadLanguage(langCode);
                languageDropdown.classList.remove('active');
            });
        });
    }

    /**
     * Update language switcher to show current language
     */
    updateLanguageSwitcher() {
        const currentLangDisplay = document.getElementById('currentLang');
        const currentLangCode = document.getElementById('currentLangCode');

        // Flag emoji mapping for all supported languages
        const flagMap = {
            'vi': '🇻🇳',
            'en': '🇬🇧',
            'cn': '🇨🇳',
            'ko': '🇰🇷',
            'ja': '🇯🇵',
            'de': '🇩🇪',
            'es': '🇪🇸',
            'th': '🇹🇭'
        };

        if (currentLangDisplay) {
            const flag = flagMap[this.currentLang] || '🌐';
            currentLangDisplay.textContent = flag;
        }

        if (currentLangCode) {
            currentLangCode.textContent = this.currentLang.toUpperCase();
        }

        // Update active state in dropdown
        document.querySelectorAll('.language-option').forEach(option => {
            if (option.getAttribute('data-lang') === this.currentLang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    /**
     * Get current language code
     */
    getCurrentLanguage() {
        return this.currentLang;
    }

    /**
     * Get all translations (useful for dynamic content)
     */
    getTranslations() {
        return this.translations;
    }
}

// Create global instance
const i18n = new I18n();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}
