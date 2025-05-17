<template>
    <transition ref="tableContainer" name="slide-fade" appear>
        <div v-if="$route.name === 'DashboardHome' || $route.name === 'GroupView'" class="dashboard-container">
            
            <!-- Titre du groupe si on est sur une URL /groupe/id -->
            <div v-if="groupId && groupName" class="shadow-box mb-3 group-header">
                <h2 class="group-title">
                    <font-awesome-icon icon="folder" class="me-2" />
                    {{ groupName }}
                </h2>
            </div>

            <!-- Mode De Vue Table Card et Filtres -->
            <div class="shadow-box mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <!-- Filtres à gauche -->
                    <div class="filters-container">
                        <MonitorListFilter :filterState="filterState" @updateFilter="updateFilter" />
                    </div>
                    
                    <!-- Barre de recherche et boutons de mode d'affichage à droite -->
                    <div class="view-mode-buttons">
                        <!-- Champ de recherche -->
                        <div class="search-container me-3">
                            <div class="search-box">
                                <input 
                                    type="text" 
                                    class="search-input" 
                                    v-model="searchText" 
                                    :placeholder="$t('Search...')" 
                                    @input="onSearchInput"
                                >
                                <span v-if="searchText" class="search-icon clear-icon" @click="clearSearch">
                                    <font-awesome-icon :icon="['fas', 'times']" />
                                </span>
                                <span v-else class="search-icon">
                                    <font-awesome-icon :icon="['fas', 'search']" />
                                </span>
                            </div>
                        </div>
                        
                        <!-- Boutons de modes de vue -->
                        <div class="view-mode-toggle">
                            <button 
                                type="button" 
                                class="btn toggle-btn" 
                                :class="viewMode === 'table' ? 'active' : ''" 
                                @click="changeViewMode('table')"
                            >
                                <img src="/table-view-icon.svg" alt="Table View" class="view-icon" />
                            </button>
                            <button 
                                type="button" 
                                class="btn toggle-btn" 
                                :class="viewMode === 'card' ? 'active' : ''" 
                                @click="changeViewMode('card')"
                            >
                                <img src="/card-view-icon.svg" alt="Card View" class="view-icon" />
                            </button>
                            <button 
                                type="button" 
                                class="btn toggle-btn ms-2" 
                                :class="{ 'active': showWebSocketDebug }" 
                                @click="toggleWebSocketDebug"
                                title="WebSocket Debug"
                            >
                                <font-awesome-icon icon="wifi" />
                            </button>
                            
                            <!-- Bouton de configuration de la grille (visible uniquement en mode carte) -->
                            <button 
                                v-if="viewMode === 'card'"
                                type="button" 
                                class="btn toggle-btn ms-2" 
                                @click="showGridConfig = true"
                                :title="$t('Configure grid layout')"
                            >
                                <img src="/grid-config-icon.svg" alt="Grid Configuration" class="view-icon" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Table View -->
            <div v-if="viewMode === 'table'" class="shadow-box table-shadow-box" style="overflow-x: hidden;">
                <table class="table table-borderless table-hover">
                    <thead>
                        <tr>
                            <th>{{ $t("Name") }}</th>
                            <th>{{ $t("Status") }}</th>
                            <th>{{ $t("DateTime") }}</th>
                            <th>{{ $t("Message") }}</th>
                            <th>{{ $t("Progress") }}</th>
                            <th>{{ $t("Graph") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr 
                            v-for="(monitor, index) in sortedMonitors" 
                            :key="index" 
                            :class="{ 
                                'shadow-box': $root.windowWidth <= 550,
                                'monitor-down': monitor.status === 0
                            }"
                        >
                            <td class="name-column"><router-link :to="`/dashboard/${monitor.id}`">{{ monitor.name }}</router-link></td>
                            <td><Status :status="monitor.status" /></td>
                            <td><Datetime v-if="monitor.lastHeartbeat" :value="monitor.lastHeartbeat.time" /></td>
                            <td>{{ monitor.lastHeartbeat ? monitor.lastHeartbeat.msg : '' }}</td>
                            <td class="progress-column">
                                <div class="table-progress-bar">
                                    <div class="progress-dots">
                                        <div class="progress-fill" 
                                             :class="{ 'bg-danger': monitor.status === 0, 'bg-success': monitor.status === 1 }"
                                             :style="{ width: getProgressPercentage(monitor.id) + '%' }"></div>
                                    </div>
                                </div>
                            </td>
                            <td class="chart-column">
                                <SimpleChart :monitor-id="monitor.id" mini />
                            </td>
                        </tr>

                        <tr v-if="Object.keys($root.monitorList).length === 0">
                            <td colspan="6" class="text-center py-4">
                                {{ $t("No monitors to display") }}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="d-flex justify-content-center kuma_pagination">
                    <pagination
                        v-model="page"
                        :records="Object.keys(filteredMonitors).length"
                        :per-page="perPage"
                        :options="paginationConfig"
                    />
                </div>
            </div>

            <!-- Card View -->
            <div v-if="viewMode === 'card'" class="card-view">
                <div v-if="Object.keys($root.monitorList).length === 0" class="shadow-box text-center">
                    {{ $t("No monitors to display") }}
                </div>
                <div v-else class="row" ref="cardContainer">
                    <div v-for="(monitor, index) in sortedMonitors" :key="index" class="col-12 col-md-6 col-lg-4 mb-4">
                        <div class="monitor-card shadow-box" :class="{ 'monitor-down': monitor.status === 0 }">
                            <div class="monitor-card-header">
                                <router-link :to="`/dashboard/${monitor.id}`" class="monitor-name">
                                    {{ monitor.name }}
                                </router-link>
                                <Status :status="monitor.status" />
                            </div>
                            <div class="monitor-card-chart">
                                <PingChart :monitor-id="monitor.id" mini />
                            </div>
                            <div class="monitor-card-footer">
                                <div class="monitor-last-check">
                                    <Datetime v-if="monitor.lastHeartbeat" :value="monitor.lastHeartbeat.time" />
                                </div>
                                <div v-if="monitor.lastHeartbeat && monitor.lastHeartbeat.msg" class="monitor-message mt-2">
                                    {{ monitor.lastHeartbeat.msg }}
                                </div>
                                <div class="monitor-progress-bar mt-2">
                                    <div class="progress-dots">
                                        <div class="progress-fill" 
                                             :class="{ 'bg-danger': monitor.status === 0, 'bg-success': monitor.status === 1 }"
                                             :style="{ width: getProgressPercentage(monitor.id) + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-center kuma_pagination mt-3">
                    <pagination
                        v-model="page"
                        :records="Object.keys(filteredMonitors).length"
                        :per-page="perPage"
                        :options="paginationConfig"
                    />
                </div>
            </div>
        </div>
    </transition>
    <router-view ref="child" />
    
    <!-- Modal de configuration de la grille -->
    <GridConfigDialog 
        :show="showGridConfig" 
        viewType="dashboard"
        @close="showGridConfig = false"
        @grid-updated="updateGridConfig" 
    />
    
    <!-- Composant de débogage WebSocket -->
    <WebSocketDebug v-if="showWebSocketDebug" class="mt-4" />
</template>

<script>
import Status from "../components/Status.vue";
import Datetime from "../components/Datetime.vue";
import Pagination from "v-pagination-3";
import PingChart from "../components/PingChart.vue";
import SimpleChart from "../components/SimpleChart.vue";
import MonitorListFilter from "../components/MonitorListFilter.vue";
import GridConfigDialog from "../components/GridConfigDialog.vue";
import WebSocketDebug from "../components/WebSocketDebug.vue";
import webSocketService from "../services/websocket.js";

export default {
    components: {
        Datetime,
        Status,
        Pagination,
        PingChart,
        SimpleChart,
        MonitorListFilter,
        GridConfigDialog,
        WebSocketDebug,
    },
    props: {
        calculatedHeight: {
            type: Number,
            default: 0
        },
        groupId: {
            type: [String, Number],
            default: null
        }
    },
    data() {
        return {
            viewMode: localStorage.getItem('dashboardViewMode') || 'table', // 'table' or 'card'
            page: 1,
            perPage: 25,
            initialPerPage: 25,
            paginationConfig: {
                hideCount: true,
                chunksNavigation: "scroll",
            },
            importantHeartBeatListLength: 0,
            displayedRecords: [],
            searchText: "",
            showSearch: false, // Contrôle l'affichage du champ de recherche
            filterStatus: null,
            filterState: {
                status: null,
                active: null,
                tags: null,
            },
            showGridConfig: false, // Contrôle l'affichage de la fenêtre de configuration de la grille
            gridConfig: null, // Configuration de la grille (chargée depuis localStorage)
            showWebSocketDebug: true, // Affiche le composant de débogage WebSocket
        };
    },
    computed: {
        /**
         * Récupère le nom du groupe à partir de son identifiant
         * @returns {String|null} Nom du groupe ou null si non trouvé
         */
        groupName() {
            if (!this.groupId) return null;
            
            // Recherche du groupe dans la liste des moniteurs
            const group = Object.values(this.$root.monitorList || {}).find(
                m => m.type === "group" && m.id === parseInt(this.groupId)
            );
            
            return group ? group.name : null;
        },
        
        /**
         * Filtrer les moniteurs en fonction de la recherche et des filtres
         * @returns {Object} Moniteurs filtrés
         */
        filteredMonitors() {
            const monitors = { ...(this.$root.monitorList || {}) };
            
            // Filtrer par groupe si un groupId est spécifié
            if (this.groupId) {
                Object.keys(monitors).forEach(id => {
                    const monitor = monitors[id];
                    // Vérifie si le moniteur appartient au groupe spécifié
                    if (monitor.parent !== parseInt(this.groupId)) {
                        delete monitors[id];
                    }
                });
            }
            
            // Filtrer par texte de recherche si nécessaire
            if (this.searchText) {
                const searchLower = this.searchText.toLowerCase();
                Object.keys(monitors).forEach(id => {
                    const monitor = monitors[id];
                    if (!monitor.name.toLowerCase().includes(searchLower)) {
                        delete monitors[id];
                    }
                });
            }
            
            // Filtrer par statut (status) si nécessaire
            if (this.filterState.status && this.filterState.status.length > 0) {
                Object.keys(monitors).forEach(id => {
                    const monitor = monitors[id];
                    const monitorStatus = monitor.status !== undefined ? monitor.status : 
                        (this.$root.lastHeartbeatList && this.$root.lastHeartbeatList[id] ? 
                            this.$root.lastHeartbeatList[id].status : null);
                            
                    if (monitorStatus === null || !this.filterState.status.includes(monitorStatus)) {
                        delete monitors[id];
                    }
                });
            }
            
            // Filtrer par état actif/inactif (active) si nécessaire
            if (this.filterState.active && this.filterState.active.length > 0) {
                Object.keys(monitors).forEach(id => {
                    const monitor = monitors[id];
                    if (!this.filterState.active.includes(monitor.active)) {
                        delete monitors[id];
                    }
                });
            }
            
            // Filtrer par tags si nécessaire
            if (this.filterState.tags && this.filterState.tags.length > 0) {
                Object.keys(monitors).forEach(id => {
                    const monitor = monitors[id];
                    
                    // Vérifier que le moniteur a des tags
                    if (!monitor.tags || !Array.isArray(monitor.tags) || monitor.tags.length === 0) {
                        delete monitors[id];
                        return;
                    }
                    
                    // Vérifier si le moniteur a au moins un tag qui est dans la liste des tags filtrés
                    const hasMatchingTag = monitor.tags.some(tag => 
                        this.filterState.tags.includes(tag?.tag_id || tag?.id)
                    );
                    
                    if (!hasMatchingTag) {
                        delete monitors[id];
                    }
                });
            }
            
            return monitors;
        },
        
        /**
         * Trier les moniteurs avec les DOWN en premier
         * @returns {Array} Moniteurs triés
         */
        sortedMonitors() {
            // Convertir en tableau pour le tri
            const monitorsArray = Object.values(this.filteredMonitors);
            
            // Enrichir les moniteurs avec leurs derniers battements de cœur
            monitorsArray.forEach(monitor => {
                if (this.$root.lastHeartbeatList && this.$root.lastHeartbeatList[monitor.id]) {
                    monitor.lastHeartbeat = this.$root.lastHeartbeatList[monitor.id];
                    monitor.status = monitor.lastHeartbeat.status;
                }
            });
            
            // Trier les moniteurs avec les DOWN en premier
            monitorsArray.sort((a, b) => {
                // Si a est DOWN (status 0) et b n'est pas DOWN, a devrait être en premier
                if (a.status === 0 && b.status !== 0) return -1;
                // Si a n'est pas DOWN mais b est DOWN, b devrait être en premier
                if (a.status !== 0 && b.status === 0) return 1;
                // Sinon, trier par nom
                return a.name.localeCompare(b.name);
            });
            
            // Pagination
            const start = (this.page - 1) * this.perPage;
            const end = start + this.perPage;
            return monitorsArray.slice(start, end);
        },
    },
    watch: {
        perPage() {
            this.$nextTick(() => {
                this.page = 1;
            });
        },

        page() {
            // La pagination est gérée par la propriété calculée sortedMonitors
        },
        
        "$root.monitorList": {
            handler() {
                // Si la page actuelle n'a plus assez d'éléments, revenir à la première page
                const totalPages = Math.ceil(Object.keys(this.filteredMonitors).length / this.perPage);
                if (this.page > totalPages && totalPages > 0) {
                    this.page = 1;
                }
            },
            deep: true
        }
    },

    mounted() {
        this.initialPerPage = this.perPage;

        // Ajouter des écouteurs pour les mises à jour de moniteurs
        this.$root.emitter.on("monitorListUpdated", this.onMonitorUpdate);
        
        window.addEventListener("resize", this.updatePerPage);
        this.updatePerPage();
        
        // Charger et appliquer la configuration de la grille
        this.applyGridConfig();
        
        // Ajouter un écouteur pour détecter les changements de vue
        this.$watch('viewMode', (newMode) => {
            if (newMode === 'card') {
                // Appliquer la configuration de la grille quand on passe en mode carte
                this.$nextTick(() => {
                    this.applyGridConfig();
                });
            }
        });
        
        // Initialiser la connexion WebSocket
        this.initWebSocket();
    },

    beforeUnmount() {
        // Supprimer les écouteurs
        this.$root.emitter.off("monitorListUpdated", this.onMonitorUpdate);
        window.removeEventListener("resize", this.updatePerPage);
        
        // Nettoyer les écouteurs WebSocket
        webSocketService.off('message', this.handleWebSocketMessage);
        webSocketService.off('open', this.handleWebSocketOpen);
    },

    methods: {
        /**
         * Active ou désactive l'affichage du débogueur WebSocket
         * @returns {void}
         */
        toggleWebSocketDebug() {
            this.showWebSocketDebug = !this.showWebSocketDebug;
        },
        
        /**
         * Initialise la connexion WebSocket
         * @returns {void}
         */
        initWebSocket() {
            // Ajouter les écouteurs d'événements WebSocket
            webSocketService.on('message', this.handleWebSocketMessage);
            webSocketService.on('open', this.handleWebSocketOpen);
            
            // Établir la connexion de manière sécurisée
            const connectPromise = webSocketService.connect();
            if (connectPromise && typeof connectPromise.catch === 'function') {
                connectPromise.catch(error => {
                    // En mode développement uniquement, on affiche l'erreur complète
                    if (process.env.NODE_ENV === 'development') {
                        console.error("Erreur de connexion WebSocket:", error);
                    }
                });
            }
        },
        
        /**
         * Gère l'événement d'ouverture de la connexion WebSocket
         * @param {Event} event - Événement d'ouverture
         * @returns {void}
         */
        handleWebSocketOpen(event) {
            console.log("WebSocket connecté, demande de mise à jour de statut");
            
            // Envoyer une demande de statut initial
            websocketService.send(JSON.stringify({
                type: 'request_status',
                data: {
                    groupId: this.groupId
                }
            }));
        },
        
        /**
         * Gère les messages reçus via WebSocket
         * @param {string} data - Message reçu
         * @returns {void}
         */
        handleWebSocketMessage(data) {
            try {
                const message = JSON.parse(data);
                
                if (message.type === 'status_update') {
                    console.log("Mise à jour de statut reçue via WebSocket");
                    
                    // Mettre à jour la liste des moniteurs si c'est une mise à jour de statut
                    if (message.data && message.data.monitors) {
                        this.$root.emitter.emit("monitorListUpdated");
                    }
                }
            } catch (error) {
                console.error("Erreur lors du traitement du message WebSocket:", error);
            }
        },
        
        /**
         * Gère les mises à jour de la liste des moniteurs
         * @returns {void}
         */
        onMonitorUpdate() {
            // Cette méthode sera appelée lorsque la liste des moniteurs est mise à jour
            // Le tri et le filtrage sont gérés par la propriété calculée sortedMonitors
        },

        /**
         * Updates the number of items shown per page based on the available height.
         * @returns {void}
         */
        updatePerPage() {
            const tableContainer = this.$refs.tableContainer;
            // Vérifier que l'élément existe avant d'essayer d'accéder à sa hauteur
            if (!tableContainer) {
                return;
            }
            
            const tableContainerHeight = tableContainer.offsetHeight;
            const availableHeight = window.innerHeight - tableContainerHeight;
            const additionalPerPage = Math.floor(availableHeight / 58);

            if (additionalPerPage > 0) {
                this.perPage = Math.max(this.initialPerPage, this.perPage + additionalPerPage);
            } else {
                this.perPage = this.initialPerPage;
            }
        },
        
        /**
         * Change the view mode and save it to localStorage
         * @param {string} mode - The view mode to switch to ('table' or 'card')
         * @returns {void}
         */
        changeViewMode(mode) {
            this.viewMode = mode;
            localStorage.setItem('dashboardViewMode', mode);
        },
        
        /**
         * Update filter state when filters are changed
         * @param {Object} newFilterState - The new filter state
         * @returns {void}
         */
        updateFilter(newFilterState) {
            this.filterState = newFilterState;
            
            // Réinitialiser la pagination à la première page
            this.page = 1;
        },
        
        /**
         * Calculates the percentage of the progress bar that should be filled
         * @param {number} monitorID - ID of the monitor
         * @returns {number} - Percentage (0-100) of the progress bar to fill
         */
        getProgressPercentage(monitorID) {
            const monitor = this.$root.monitorList[monitorID];
            if (!monitor) return 0;
            
            // Get percentage based on monitor status
            const statusDict = {
                up: 75, // 75% filled
                down: 25, // 25% filled
                pending: 50, // 50% filled
                maintenance: 50 // 50% filled
            };
            
            // Convertir le statut en chaîne puis le mettre en minuscules
            let statusString = 'up';
            if (monitor.active) {
                // Si le moniteur est actif, déterminer le statut réel
                if (monitor.status === 0) {
                    statusString = 'down';
                } else if (monitor.status === 1) {
                    statusString = 'up';
                } else if (monitor.status === 2) {
                    statusString = 'pending';
                } else if (monitor.status === 3) {
                    statusString = 'maintenance';
                }
            } else {
                statusString = 'down';
            }
            
            const status = statusString;
            return statusDict[status] || 75;
        },
        
        /**
         * Gère la saisie dans le champ de recherche
         * @returns {void}
         */
        onSearchInput() {
            // Réinitialise la pagination
            this.page = 1;
        },
        
        /**
         * Vide le champ de recherche
         * @returns {void}
         */
        clearSearch() {
            this.searchText = "";
            this.page = 1;
        },
        
        /**
         * Mettre à jour la configuration de la grille
         * @param {Object} config - La nouvelle configuration
         * @returns {void}
         */
        updateGridConfig(config) {
            this.gridConfig = config;
            
            // Sauvegarder la configuration dans localStorage
            localStorage.setItem('dashboardGridConfig', JSON.stringify(config));
            
            // Appliquer la nouvelle configuration à la grille
            // avec un délai pour s'assurer que le DOM est mis à jour
            setTimeout(() => {
                this.applyGridConfig();
            }, 50);
        },
        
        /**
         * Appliquer la configuration de la grille aux cartes de moniteurs
         * @returns {void}
         */
        applyGridConfig() {
            if (!this.gridConfig) {
                // Charger la configuration depuis localStorage si disponible
                const savedConfig = localStorage.getItem('dashboardGridConfig');
                if (savedConfig) {
                    this.gridConfig = JSON.parse(savedConfig);
                } else {
                    // Configuration par défaut
                    this.gridConfig = {
                        cardSize: 300,
                        cardsPerRow: 3,
                        cardGap: 15
                    };
                }
            }
            
            // Appliquer les styles CSS à la grille
            this.$nextTick(() => {
                // Utiliser directement la référence au conteneur de cartes
                const cardContainer = this.$refs.cardContainer;
                if (cardContainer) {
                    // Configurer la grille en utilisant CSS Grid
                    cardContainer.style.display = 'grid';
                    cardContainer.style.gridTemplateColumns = `repeat(${this.gridConfig.cardsPerRow}, minmax(${this.gridConfig.cardSize}px, 1fr))`;
                    cardContainer.style.gap = `${this.gridConfig.cardGap}px`;
                    cardContainer.style.width = '100%';
                    
                    // Réinitialiser la classe col-* sur les éléments
                    const cardItems = cardContainer.querySelectorAll('[class*="col-"]');
                    cardItems.forEach(item => {
                        // Supprimer les classes col-* de Bootstrap
                        const classes = item.className.split(' ').filter(c => !c.startsWith('col-'));
                        item.className = classes.join(' ');
                        
                        // Définir le style de la carte
                        item.style.width = '100%';
                        item.style.maxWidth = '100%';
                        item.style.marginBottom = '0';
                    });
                }
            });
        }
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars";

/* Styles pour l'en-tête de groupe */
.group-header {
    padding: 15px 20px;
    margin-bottom: 20px;
}

.group-title {
    font-size: 1.5rem;
    margin: 0;
    color: var(--color-primary);
    display: flex;
    align-items: center;
}

.dashboard-container {
    display: flex;
    flex-direction: column;
}

/* Animation pour les éléments en état DOWN */
@keyframes flash-red {
    0%, 100% {
        background-color: transparent;
        border-color: $danger;
    }
    50% {
        background-color: rgba($danger, 0.1);
        border-color: $danger;
    }
}

/* Applique l'animation aux éléments en état DOWN dans la vue tableau */
tr.monitor-down {
    animation: flash-red 2s infinite;
    border-left: 3px solid $danger;
    position: relative;
}

/* Applique l'animation aux cartes en état DOWN dans la vue carte */
.monitor-card.monitor-down {
    animation: flash-red 2s infinite;
    border-left: 3px solid $danger;
    position: relative;
}

.num {
    font-size: 30px;
    color: $success; // Changé de $primary à $success pour le statut UP
    font-weight: bold;
    display: block;
}

.shadow-box {
    padding: 20px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.07);
    border: 1px solid rgba(0, 0, 0, 0.03);
    
    .dark & {
        background-color: $dark-bg;
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
        border-color: $dark-border-color;
    }
}

/* Styles pour la vue des cartes, avec ajustements pour la sidebar redimensionnable */
.card-view {
    display: flex;
    flex-direction: column;
    padding: 0 15px;
    
    .row {
        margin-right: -15px;
        margin-left: -15px;
        
        > [class*="col-"] {
            padding: 8px;
            margin-bottom: 0;
        }
    }
}

.table-shadow-box {
    padding-left: 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

/* Styles pour les filtres et boutons de mode d'affichage */
.filters-container {
    display: flex;
    align-items: center;
}

.view-mode-buttons {
    display: flex;
    align-items: center;
}

.view-mode-toggle {
    display: flex;
    background-color: #f0f0f0;
    border-radius: 10px;
    padding: 3px;
    
    .dark & {
        background-color: $dark-bg;
    }
    
    .toggle-btn {
        padding: 8px 15px;
        border: none;
        background: transparent;
        border-radius: 8px;
        transition: all 0.2s ease;
        margin: 0 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .view-icon {
            width: 24px;
            height: 24px;
            display: block;
        }
        
        &:hover {
            .view-icon {
                filter: invert(55%) sepia(96%) saturate(1246%) hue-rotate(184deg) brightness(100%) contrast(88%);
            }
        }
        
        &.active {
            background-color: white;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            
            .view-icon {
                filter: invert(55%) sepia(96%) saturate(1246%) hue-rotate(184deg) brightness(100%) contrast(88%);
            }
            
            .dark & {
                background-color: $dark-header-bg;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                
                .view-icon {
                    filter: invert(65%) sepia(12%) saturate(1740%) hue-rotate(169deg) brightness(95%) contrast(96%);
                }
            }
        }
        
        &:not(.active) .view-icon {
            opacity: 0.6;
        }
        
        .dark & {
            &:not(.active) .view-icon {
                filter: invert(100%);
                opacity: 0.7;
            }
        }
    }
}

/* Styles pour le champ de recherche */
.search-container {
    position: relative;
}

.search-box {
    position: relative;
    background: #f5f5f5;
    border-radius: 10px;
    width: 280px;
    height: 36px;
    display: flex;
    align-items: center;
    border: 1px solid #e0e0e0;
    transition: all 0.2s ease;

    &:focus-within {
        border-color: $success;
        box-shadow: 0 0 0 3px rgba($success, 0.2);
    }

    .dark & {
        background: rgba(0, 0, 0, 0.2);
        border-color: $dark-border-color;
    }
}

.search-input {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    color: #333;
    padding: 0 40px 0 15px;
    border-radius: 10px;
    
    &::placeholder {
        color: #666;
    }
    
    .dark & {
        color: #fff;
        
        &::placeholder {
            color: rgba(255, 255, 255, 0.6);
        }
    }
    
    font-size: 0.9rem;
    
    &:focus {
        outline: none;
    }
}

.search-icon {
    position: absolute;
    right: 12px;
    color: #777;
    font-size: 0.9rem;
    
    .dark & {
        color: rgba(255, 255, 255, 0.7);
    }
}

.clear-icon {
    cursor: pointer;
    color: #777;
    transition: color 0.2s ease-in-out, transform 0.1s ease-in-out;
    
    &:hover {
        color: $danger;
    }
    
    &:active {
        transform: scale(1.1);
    }
    
    .dark & {
        color: rgba(255, 255, 255, 0.7);
        
        &:hover {
            color: $danger;
        }
    }
}

@media (max-width: 768px) {
    /* Adaptation pour mobile */
    .d-flex.justify-content-between.align-items-center {
        flex-direction: column;
    }
    
    .filters-container {
        margin-bottom: 15px;
        width: 100%;
    }
    
    .view-mode-buttons {
        margin-top: 10px;
        width: 100%;
    }
    
    .search-box {
        width: 100%;
        margin-bottom: 10px;
    }
}

table {
    font-size: 14px;
    border-collapse: separate;
    border-spacing: 0;

    thead {
        th {
            background-color: #f8f9fa;
            padding: 12px 15px;
            border-bottom: 2px solid #eaecef;
            font-weight: 600;
            
            .dark & {
                background-color: $dark-bg;
                border-bottom-color: $dark-border-color;
            }
        }
    }

    tr {
        transition: all ease-in-out 0.2s;
        
        &:hover:not(.monitor-down) {
            background-color: rgba($success, 0.03);
            
            .dark & {
                background-color: rgba($success, 0.1);
            }
        }
    }
    
    td {
        padding: 12px 15px;
        border-bottom: 1px solid #eaecef;
        
        .dark & {
            border-bottom-color: $dark-border-color;
        }
    }

    @media (max-width: 550px) {
        table-layout: fixed;
        overflow-wrap: break-word;
    }
}

.monitor-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 140px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid rgba(0, 0, 0, 0.05);
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    }
    
    .dark & {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        border-color: $dark-border-color;
        
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
        }
    }

    .monitor-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
        
        .monitor-name {
            font-weight: bold;
            font-size: 1rem;
            color: $success; // Changé de $primary à $success
            text-decoration: none;
            
            &:hover {
                text-decoration: underline;
            }
        }
    }
    
    .monitor-card-chart {
        flex-grow: 1;
        min-height: 90px;
        margin-bottom: 6px;
    }
    
    .monitor-card-footer {
        font-size: 0.85rem;
        margin-top: auto;
        
        .monitor-last-check {
            font-weight: 500;
        }
        
        .monitor-message {
            color: $secondary-text;
            margin-bottom: 6px;
        }
        
        .monitor-progress-bar {
            .progress-dots {
                position: relative;
                height: 6px;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 10px;
                overflow: hidden;
                margin: 4px 0;
                
                .progress-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    /* La couleur de fond est maintenant définie par les classes conditionnelles */
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }
            }
        }
    }
}

@media screen and (max-width: 1280px) {
    .name-column {
        min-width: 150px;
    }
}

@media screen and (min-aspect-ratio: 4/3) {
    .name-column {
        min-width: 200px;
    }
}

.progress-column {
    width: 180px;
}

.chart-column {
    width: 200px;
}

.table-progress-bar {
    .progress-dots {
        position: relative;
        height: 6px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 10px;
        overflow: hidden;
        margin: 4px 0;
        
        .progress-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            /* La couleur de fond est maintenant définie par les classes conditionnelles */
            border-radius: 10px;
            transition: width 0.5s ease;
        }
    }
}
</style>
