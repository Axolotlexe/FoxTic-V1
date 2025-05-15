export default {

    data() {
        return {
            system: (window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light",
            userTheme: localStorage.theme,
            userHeartbeatBar: localStorage.heartbeatBarTheme,
            styleElapsedTime: localStorage.styleElapsedTime,
            statusPageTheme: "light",
            forceStatusPageTheme: false,
            path: "",
            systemThemeMediaQuery: window.matchMedia("(prefers-color-scheme: dark)"),
        };
    },

    mounted() {
        // Default Light
        if (! this.userTheme) {
            this.userTheme = "auto";
        }

        // Default Heartbeat Bar
        if (!this.userHeartbeatBar) {
            this.userHeartbeatBar = "normal";
        }

        // Default Elapsed Time Style
        if (!this.styleElapsedTime) {
            this.styleElapsedTime = "no-line";
        }

        // Écouter les changements de préférences de thème du système
        this.systemThemeMediaQuery.addEventListener("change", this.handleSystemThemeChange);

        document.body.classList.add(this.theme);
        this.updateThemeColorMeta();
    },
    
    beforeUnmount() {
        // Nettoyer l'écouteur d'événements
        this.systemThemeMediaQuery.removeEventListener("change", this.handleSystemThemeChange);
    },

    computed: {
        theme() {
            // As entry can be status page now, set forceStatusPageTheme to true to use status page theme
            if (this.forceStatusPageTheme) {
                if (this.statusPageTheme === "auto") {
                    return this.system;
                }
                return this.statusPageTheme;
            }

            // Entry no need dark
            if (this.path === "") {
                return "light";
            }

            if (this.path.startsWith("/status-page") || this.path.startsWith("/status")) {
                if (this.statusPageTheme === "auto") {
                    return this.system;
                }
                return this.statusPageTheme;
            } else {
                if (this.userTheme === "auto") {
                    return this.system;
                }
                return this.userTheme;
            }
        },

        isDark() {
            return this.theme === "dark";
        }
    },

    watch: {
        "$route.fullPath"(path) {
            this.path = path;
        },

        userTheme(to, from) {
            localStorage.theme = to;
        },

        styleElapsedTime(to, from) {
            localStorage.styleElapsedTime = to;
        },

        theme(to, from) {
            document.body.classList.remove(from);
            document.body.classList.add(this.theme);
            this.updateThemeColorMeta();
        },

        userHeartbeatBar(to, from) {
            localStorage.heartbeatBarTheme = to;
        },

        heartbeatBarTheme(to, from) {
            document.body.classList.remove(from);
            document.body.classList.add(this.heartbeatBarTheme);
        }
    },

    methods: {
        /**
         * Update the theme color meta tag
         * @returns {void}
         */
        updateThemeColorMeta() {
            if (this.theme === "dark") {
                document.querySelector("#theme-color").setAttribute("content", "#161B22");
            } else {
                document.querySelector("#theme-color").setAttribute("content", "#5cdd8b");
            }
        },
        
        /**
         * Gère les changements de préférences de thème du système
         * @param {MediaQueryListEvent} event L'événement de changement de media query
         * @returns {void}
         */
        handleSystemThemeChange(event) {
            try {
                // Mémoriser l'ancien thème système avant de le mettre à jour
                const oldSystem = this.system;
                
                // Mettre à jour la préférence système (dark ou light)
                this.system = event.matches ? "dark" : "light";
                
                // Notifier l'interface utilisateur qu'un changement a eu lieu
                this.$emit("system-theme-changed", this.system);
                
                // Si l'utilisateur est en mode auto, le thème sera automatiquement mis à jour
                // grâce au watcher sur theme() qui utilise this.system
                if (this.userTheme === "auto") {
                    // Vérifier si la méthode est disponible avant de l'appeler
                    if (typeof this.showThemeChangeNotification === 'function') {
                        this.showThemeChangeNotification(oldSystem, this.system);
                    }
                }
                
                // Journaliser pour le débogage
                console.log(`[THEME] Système changé: ${oldSystem} → ${this.system}`);
            } catch (error) {
                console.error("[THEME] Erreur dans handleSystemThemeChange:", error);
            }
        },
        
        /**
         * Affiche une notification informant l'utilisateur du changement de thème système
         * @param {string} oldTheme L'ancien thème
         * @param {string} newTheme Le nouveau thème
         * @returns {void}
         */
        showThemeChangeNotification(oldTheme, newTheme) {
            try {
                // Vérifier si nous avons un accès à la fonction de toast
                if (this.$toast) {
                    // S'assurer que le i18n est disponible
                    let message = "";
                    if (this.$i18n && typeof this.$i18n.t === 'function') {
                        message = `${this.$i18n.t("System theme changed")}: ${this.$i18n.t(oldTheme === "dark" ? "Light" : "Dark")} → ${this.$i18n.t(newTheme === "dark" ? "Dark" : "Light")}`;
                    } else {
                        // Fallback sans traduction
                        message = `System theme changed: ${oldTheme === "dark" ? "Light" : "Dark"} → ${newTheme === "dark" ? "Dark" : "Light"}`;
                    }
                    
                    this.$toast.info(message, {
                        timeout: 3000,
                        position: "bottom-right",
                        hideProgressBar: false
                    });
                    
                    // Journaliser pour le débogage
                    console.log("[THEME] Notification de changement de thème:", message);
                }
            } catch (error) {
                console.error("[THEME] Erreur dans showThemeChangeNotification:", error);
            }
        }
    }
};

