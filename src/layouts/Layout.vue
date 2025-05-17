<template>
    <div :class="classes">

        <!-- Desktop header -->
        <header v-if="! $root.isMobile" class="d-flex flex-wrap justify-content-center py-3 mb-3 floating-header">
            <router-link to="/dashboard" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-dark text-decoration-none site-logo">
                <img src="/icon.svg" alt="FoxTic Logo" class="bi me-2 ms-4 logo-image" width="40" height="40" />
                <span class="fs-4 title">{{ $t("FoxTic") }}</span>
            </router-link>

            <a v-if="hasNewVersion" target="_blank" href="https://github.com/louislam/uptime-kuma/releases" class="btn btn-update me-3">
                <font-awesome-icon icon="arrow-alt-circle-up" /> {{ $t("New Update") }}
            </a>

            <ul class="nav nav-pills">

                <li v-if="$root.loggedIn" class="nav-item me-2">
                    <router-link to="/dashboard" class="nav-link">
                        <font-awesome-icon icon="tachometer-alt" /> {{ $t("Dashboard") }}
                    </router-link>
                </li>
                <li v-if="$root.loggedIn" class="nav-item">
                    <div class="dropdown dropdown-profile-pic">
                        <div class="nav-link" data-bs-toggle="dropdown">
                            <div class="profile-pic">{{ $root.usernameFirstChar }}</div>
                            <font-awesome-icon icon="angle-down" />
                        </div>

                        <!-- Header's Dropdown Menu -->
                        <ul class="dropdown-menu">
                            <!-- Username -->
                            <li>
                                <i18n-t v-if="$root.username != null" tag="span" keypath="signedInDisp" class="dropdown-item-text">
                                    <strong>{{ $root.username }}</strong>
                                </i18n-t>
                                <span v-if="$root.username == null" class="dropdown-item-text">{{ $t("signedInDispDisabled") }}</span>
                            </li>

                            <li><hr class="dropdown-divider"></li>

                            <!-- Functions -->
                            <!-- Maintenance menu entry removed
                            <li>
                                <router-link to="/maintenance" class="dropdown-item" :class="{ active: $route.path.includes('manage-maintenance') }">
                                    <font-awesome-icon icon="wrench" /> {{ $t("Maintenance") }}
                                </router-link>
                            </li>
                            -->

                            <li>
                                <router-link to="/logs" class="dropdown-item" :class="{ active: $route.path.includes('logs') }">
                                    <font-awesome-icon icon="clipboard-list" /> {{ $t("Logs") }}
                                </router-link>
                            </li>
                            
                            <li>
                                <router-link to="/ws-debug" class="dropdown-item" :class="{ active: $route.path.includes('ws-debug') }">
                                    <font-awesome-icon icon="exchange-alt" /> {{ $t("WebSocket Debug") }}
                                </router-link>
                            </li>
                            
                            <li>
                                <router-link to="/settings/general" class="dropdown-item" :class="{ active: $route.path.includes('settings') }">
                                    <font-awesome-icon icon="cog" /> {{ $t("Settings") }}
                                </router-link>
                            </li>

                            <li>
                                <a href="#" class="dropdown-item" target="_blank">
                                    <font-awesome-icon icon="info-circle" /> {{ $t("Help") }}
                                </a>
                            </li>

                            <li v-if="$root.loggedIn && $root.socket.token !== 'autoLogin'">
                                <button class="dropdown-item" @click="$root.logout">
                                    <font-awesome-icon icon="sign-out-alt" />
                                    {{ $t("Logout") }}
                                </button>
                            </li>
                        </ul>
                    </div>
                </li>
            </ul>
        </header>

        <!-- Mobile header -->
        <header v-else class="d-flex flex-wrap justify-content-center pt-2 pb-2 mb-3 floating-header-mobile">
            <router-link to="/dashboard" class="d-flex align-items-center text-dark text-decoration-none site-logo">
                <img src="/icon.svg" alt="FoxTic Logo" class="bi me-1 ms-1 logo-image" width="36" height="36" />
                <span class="fs-4 title ms-1">FoxTic</span>
            </router-link>
        </header>

        <main>
            <router-view v-if="$root.loggedIn" />
            <Login v-if="! $root.loggedIn && $root.allowLoginDialog" />
        </main>

        <!-- Mobile Only - Ajout d'espace supplémentaire en bas -->
        <div v-if="$root.isMobile" style="width: 100%; height: calc(80px + env(safe-area-inset-bottom));" />
        <nav v-if="$root.isMobile && $root.loggedIn" class="bottom-nav">
            <router-link to="/dashboard" class="nav-link">
                <div><font-awesome-icon icon="tachometer-alt" /></div>
                {{ $t("Home") }}
            </router-link>

            <router-link to="/list" class="nav-link">
                <div><font-awesome-icon icon="list" /></div>
                {{ $t("List") }}
            </router-link>

            <router-link to="/add" class="nav-link">
                <div><font-awesome-icon icon="plus" /></div>
                {{ $t("Add") }}
            </router-link>

            <router-link to="/settings" class="nav-link">
                <div><font-awesome-icon icon="cog" /></div>
                {{ $t("Settings") }}
            </router-link>
        </nav>

        <button
            v-if="numActiveToasts != 0"
            type="button"
            class="btn btn-normal clear-all-toast-btn"
            @click="clearToasts"
        >
            <font-awesome-icon icon="times" />
        </button>
    </div>
</template>

<script>
import Login from "../components/Login.vue";
import compareVersions from "compare-versions";
import { useToast } from "vue-toastification";
const toast = useToast();

export default {

    components: {
        Login,
    },

    data() {
        return {
            toastContainer: null,
            numActiveToasts: 0,
            toastContainerObserver: null,
            connectionLostToastId: null,
        };
    },

    computed: {

        // Theme or Mobile
        classes() {
            const classes = {};
            classes[this.$root.theme] = true;
            classes["mobile"] = this.$root.isMobile;
            return classes;
        },

        hasNewVersion() {
            if (this.$root.info.latestVersion && this.$root.info.version) {
                return compareVersions(this.$root.info.latestVersion, this.$root.info.version) >= 1;
            } else {
                return false;
            }
        },

    },

    watch: {
        '$root.socket.connected': {
            handler(connected) {
                // Only show notification if we already had a connection before (not first connect)
                if (!connected && !this.$root.socket.firstConnect) {
                    const toastOptions = {
                        timeout: false, // Persistent until connection is back
                        type: 'error',
                        position: 'top-right', // Pour que les notifications s'empilent vers le bas
                        closeOnClick: false,
                        icon: false, // Pas d'icône par défaut pour permettre un design personnalisé
                        toastClassName: 'connection-error-toast'
                    };

                    // Créer un élément div pour le contenu de la notification
                    const container = document.createElement('div');
                    container.className = 'connection-error-notification';
                    
                    // Créer l'en-tête de la notification
                    const title = document.createElement('div');
                    title.className = 'connection-error-title';
                    title.innerHTML = '<i class="fas fa-wifi"></i> ' + this.$t('Connection Error');
                    
                    // Créer le corps du message
                    const message = document.createElement('div');
                    message.className = 'connection-error-msg';
                    message.textContent = this.$t('Connection to socket server lost. Reconnecting...');
                    
                    // Ajouter les éléments au conteneur
                    container.appendChild(title);
                    container.appendChild(message);
                    
                    // Ajouter le guide de proxy inversé si nécessaire
                    if (this.$root.showReverseProxyGuide) {
                        const guide = document.createElement('div');
                        guide.className = 'connection-error-guide mt-2';
                        
                        const guideText = document.createTextNode(this.$t('Using a Reverse Proxy?') + ' ');
                        guide.appendChild(guideText);
                        
                        const link = document.createElement('a');
                        link.href = '#';
                        link.target = '_blank';
                        link.textContent = this.$t('Check how to config it for WebSocket');
                        
                        guide.appendChild(link);
                        container.appendChild(guide);
                    }
                    
                    // Ajouter le bouton de rechargement
                    const button = document.createElement('button');
                    button.className = 'btn btn-sm btn-primary mt-2 custom-reload-btn';
                    button.innerHTML = '<i class="fas fa-sync"></i> ' + this.$t('Reload');
                    button.onclick = () => this.reloadPage();
                    
                    container.appendChild(button);
                    
                    this.connectionLostToastId = toast.error(container, toastOptions);
                } else if (connected && this.connectionLostToastId) {
                    // Remove the toast when connection is back
                    toast.dismiss(this.connectionLostToastId);
                    this.connectionLostToastId = null;
                    
                    // Show a success notification briefly
                    toast.success(this.$t('Connection Restored'), {
                        timeout: 3000,
                        position: 'top-right',
                        icon: 'wifi'
                    });
                }
            },
            immediate: true
        }
    },

    mounted() {
        this.toastContainer = document.querySelector(".top-right.toast-container");

        // Watch the number of active toasts
        this.toastContainerObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    this.numActiveToasts = mutation.target.children.length;
                }
            }
        });

        if (this.toastContainer != null) {
            this.toastContainerObserver.observe(this.toastContainer, { childList: true });
        }
    },

    beforeUnmount() {
        this.toastContainerObserver.disconnect();
    },

    methods: {
        /**
         * Clear all toast notifications.
         * @returns {void}
         */
        clearToasts() {
            toast.clear();
        },

        /**
         * Reload the page to reconnect.
         * @returns {void}
         */
        reloadPage() {
            window.location.reload();
        }
    },

};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";



.nav-link {
    color: #555;
    border-radius: 10px;
    transition: all 0.2s ease;
    margin: 0 2px;
    font-weight: 500;
    
    &:hover {
        background-color: $success;
        color: #fff;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(40, 167, 69, 0.2);

        .dark & {
            background-color: $success;
            color: #000;
            box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
        }

        &.active {
            background-color: $highlight;
        }
    }
    
    &.active {
        background-color: rgba($success, 0.1);
        color: $success;
        
        .dark & {
            background-color: rgba($success, 0.2);
        }
    }

    &.status-page {
        background-color: rgba(255, 255, 255, 0.1);
    }
}

.bottom-nav {
    z-index: 1000;
    position: fixed;
    bottom: 0;
    height: calc(60px + env(safe-area-inset-bottom));
    width: 100%;
    left: 0;
    background-color: white;
    box-shadow: 0 -2px 10px rgba(92, 221, 139, 0.1);
    text-align: center;
    white-space: nowrap;
    padding: 0 10px env(safe-area-inset-bottom);
    border-top: 1px solid $success;

    a {
        text-align: center;
        width: 25%;
        display: inline-block;
        height: 100%;
        padding: 8px 10px 0;
        font-size: 13px;
        color: #555;
        overflow: hidden;
        text-decoration: none;
        transition: all 0.2s ease;

        &.router-link-exact-active, &.active {
            color: $success;
            font-weight: bold;
            transform: translateY(-2px);
        }

        &:active {
            transform: scale(0.95);
        }

        div {
            font-size: 20px;
            margin-bottom: 2px;
        }
    }
    
    .dark & {
        background-color: $dark-bg;
        box-shadow: 0 -2px 10px rgba(92, 221, 139, 0.15);
        border-top: 1px solid rgba($success, 0.4);
        
        a {
            color: rgba(255, 255, 255, 0.7);
            
            &.router-link-exact-active, &.active {
                color: $success;
            }
        }
    }
}

main {
    min-height: 100vh;
    padding-top: 80px;
    padding-bottom: 60px; /* Espace en bas pour éviter que le contenu soit caché par la navigation mobile */
    display: flex;
    flex-direction: column;
}

.title {
    font-weight: bold;
}

.nav {
    margin-right: 25px;
}

/* Style supprimé - remplacé par le système de toast */

.site-logo {
    position: relative;
    transition: all 0.25s ease;
    
    .logo-image {
        transition: transform 0.3s ease;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }
    
    &:hover {
        .logo-image {
            transform: scale(1.05) rotate(5deg);
        }
        
        .title {
            color: $success;
        }
    }
    
    .title {
        transition: color 0.25s ease;
        color: #333;
        letter-spacing: -0.02em;
    }
    
    .dark & {
        .title {
            color: white;
            
            &:hover {
                color: $success;
            }
        }
    }
}

.btn-update {
    background-color: white;
    color: #333;
    border: 1px solid rgba(0, 0, 0, 0.1);
    font-weight: 500;
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.25s ease;
    
    &:hover {
        background-color: rgba($success, 0.1);
        color: $success;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
    }
    
    .dark & {
        background-color: rgba(255, 255, 255, 0.15);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
        
        &:hover {
            background-color: rgba($success, 0.25);
            color: white;
        }
    }
}

// Profile Pic Button with Dropdown
.dropdown-profile-pic {
    user-select: none;

    .nav-link {
        cursor: pointer;
        display: flex;
        gap: 6px;
        align-items: center;
        background-color: rgba(240, 240, 240, 0.3);
        padding: 0.5rem 0.8rem;
        border-radius: 10px;
        transition: all 0.2s ease;
        border: 1px solid rgba(0, 0, 0, 0.05);
        
        &:hover {
            background-color: rgba($success, 0.1);
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
            transform: translateY(-1px);
        }
        
        .dark & {
            background-color: rgba(200, 200, 200, 0.1);
            border-color: rgba(255, 255, 255, 0.1);
            
            &:hover {
                background-color: rgba($success, 0.2);
                box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
            }
        }
    }

    .dropdown-menu {
        transition: all 0.25s ease;
        padding-left: 0;
        padding-bottom: 0;
        margin-top: 8px !important;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(0, 0, 0, 0.05);
        background-color: white;
        animation: fadeInDown 0.25s ease-out;

        .dropdown-divider {
            margin: 0;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
            background-color: transparent;
        }

        .dropdown-item-text {
            font-size: 14px;
            padding: 0.8rem 1rem;
            font-weight: 500;
            color: #444;
        }

        .dropdown-item {
            padding: 0.8rem 1rem;
            color: #555;
            transition: all 0.15s ease;
            font-weight: 400;
            
            &:hover, &:focus {
                background-color: rgba($success, 0.1);
                color: $success;
            }
            
            &.active {
                background-color: $success !important;
                color: white;
                font-weight: 500;
            }
        }

        .dark & {
            background-color: $dark-bg;
            color: $dark-font-color;
            border-color: $dark-border-color;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);

            .dropdown-divider {
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .dropdown-item-text {
                color: $dark-font-color;
            }

            .dropdown-item {
                color: $dark-font-color;

                &.active {
                    color: white;
                    background-color: $success !important;
                }

                &:hover, &:focus {
                    background-color: rgba($success, 0.2);
                    color: lighten($success, 25%);
                }
            }
        }
    }

    .profile-pic {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        background-color: $success;
        width: 28px;
        height: 28px;
        margin-right: 5px;
        border-radius: 50rem;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
        
        .dark & {
            box-shadow: 0 2px 6px rgba(40, 167, 69, 0.4);
        }
    }
}

@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dark {
    header {
        background-color: $dark-header-bg;
        border-bottom-color: $dark-header-bg !important;

        span {
            color: #f0f6fc;
        }
    }

    .bottom-nav {
        background-color: $dark-bg;
        border-color: rgba($success, 0.4);
        box-shadow: 0 -2px 10px rgba($success, 0.15);
    }
}

.clear-all-toast-btn {
    position: fixed;
    right: 1em;
    top: 70px; /* Position below the floating header */
    font-size: 1.1em;
    padding: 9px 15px;
    width: 48px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    z-index: 100;
    border-radius: 10px;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.05);
    color: #555;
    transition: all 0.2s ease;
    
    &:hover {
        background-color: rgba($success, 0.1);
        color: $success;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
    }
    
    &:active {
        transform: scale(0.95);
    }

    .dark & {
        background-color: $dark-bg;
        color: rgba(255, 255, 255, 0.8);
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
        
        &:hover {
            background-color: rgba($success, 0.2);
            color: white;
        }
    }
}

@media (max-width: 770px) {
    .clear-all-toast-btn {
        top: 65px; /* Adjust for mobile header */
    }
}

.floating-header {
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 1000;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
    margin-bottom: 0;
    padding: 10px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    
    &:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .dark & {
        background-color: $dark-header-bg;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
        border-color: $dark-border-color;
        
        &:hover {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
        }
    }
}

.floating-header-mobile {
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 1000;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    margin-bottom: 0;
    padding: 10px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    .dark & {
        background-color: $dark-header-bg;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        border-color: $dark-border-color;
    }
}

/* Styles globaux pour toutes les notifications */
:global(.Vue-Toastification__toast) {
    border-radius: 10px !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08) !important;
    padding: 16px !important;
    transition: all 0.25s ease !important;
    
    :global(.dark) & {
        border-color: rgba(255, 255, 255, 0.1) !important;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25) !important;
    }
    
    &:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12) !important;
        
        :global(.dark) & {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3) !important;
        }
    }
}

:global(.Vue-Toastification__toast--success) {
    background-color: rgba($success, 0.05) !important;
    color: darken($success, 15%) !important;
    border-left: 4px solid $success !important;
    
    :global(.dark) & {
        background-color: rgba($success, 0.2) !important;
        color: lighten($success, 20%) !important;
    }
}

:global(.Vue-Toastification__toast--error) {
    background-color: rgba(#EF4444, 0.05) !important;
    color: darken(#EF4444, 15%) !important;
    border-left: 4px solid #EF4444 !important;
    
    :global(.dark) & {
        background-color: rgba(#EF4444, 0.2) !important;
        color: lighten(#EF4444, 20%) !important;
    }
}

:global(.Vue-Toastification__toast--warning) {
    background-color: rgba(#F59E0B, 0.05) !important;
    color: darken(#F59E0B, 15%) !important;
    border-left: 4px solid #F59E0B !important;
    
    :global(.dark) & {
        background-color: rgba(#F59E0B, 0.2) !important;
        color: lighten(#F59E0B, 20%) !important;
    }
}

:global(.Vue-Toastification__toast--info) {
    background-color: rgba($success, 0.05) !important;
    color: darken($success, 15%) !important;
    border-left: 4px solid $success !important;
    
    :global(.dark) & {
        background-color: rgba($success, 0.2) !important;
        color: lighten($success, 20%) !important;
    }
}

:global(.Vue-Toastification__close-button) {
    color: rgba(0, 0, 0, 0.5) !important;
    transition: all 0.2s ease !important;
    
    &:hover {
        color: rgba(0, 0, 0, 0.8) !important;
        transform: scale(1.1) !important;
    }
    
    :global(.dark) & {
        color: rgba(255, 255, 255, 0.6) !important;
        
        &:hover {
            color: rgba(255, 255, 255, 0.9) !important;
        }
    }
}

/* Styles pour la notification de perte de connexion */
:global(.connection-error-toast) {
    max-width: 400px !important;
    border-radius: 10px !important; 
    border: 1px solid rgba(239, 68, 68, 0.25) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    background: rgba(255, 255, 255, 0.95) !important;
    padding: 16px !important;
    overflow: hidden !important;
    transition: all 0.25s ease !important;
    animation: fadeInSlideDown 0.5s ease-out !important;
    box-shadow: 0 5px 15px rgba(239, 68, 68, 0.08) !important;
    
    :global(.dark) & {
        background: rgba(13, 17, 23, 0.95) !important;
        border-color: rgba(239, 68, 68, 0.35) !important;
        box-shadow: 0 5px 15px rgba(239, 68, 68, 0.1) !important;
    }
}

@keyframes fadeInSlideDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

:global(.connection-error-notification) {
    text-align: center;
    
    .connection-error-title {
        font-weight: 600;
        font-size: 1.1rem;
        margin-bottom: 8px;
        color: #EF4444; /* Rouge plus vif */
    }
    
    .connection-error-msg {
        margin-bottom: 8px;
        font-size: 0.95rem;
    }
    
    .connection-error-guide {
        font-size: 0.9rem;
        opacity: 0.9;
        font-style: italic;
        
        a {
            color: $success;
            text-decoration: underline;
            
            &:hover {
                color: darken($success, 10%);
            }
        }
    }
    
    .btn {
        background: $success;
        border: 1px solid darken($success, 5%);
        transition: all 0.2s ease;
        border-radius: 10px;
        padding: 8px 20px;
        color: white;
        font-size: 0.9rem;
        box-shadow: 0 3px 8px rgba(40, 167, 69, 0.2);
        
        &:hover {
            background: lighten($success, 5%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }
        
        &:active {
            transform: scale(0.98);
        }
        
        .dark & {
            box-shadow: 0 3px 10px rgba(40, 167, 69, 0.3);
            
            &:hover {
                box-shadow: 0 4px 14px rgba(40, 167, 69, 0.4);
            }
        }
    }
    
    .custom-reload-btn {
        font-weight: 500;
        letter-spacing: 0.02em;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        
        i {
            font-size: 0.85em;
        }
    }
}
</style>
