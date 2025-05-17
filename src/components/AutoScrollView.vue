<template>
    <div class="auto-scroll-container">
        <!-- Barre latérale avec les groupes -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h3>{{ $t("Groups") }}</h3>
                <div class="controls">
                    <button class="btn btn-sm btn-outline-secondary" @click="togglePause" :title="isPaused ? $t('Resume') : $t('Pause')">
                        <font-awesome-icon :icon="isPaused ? 'play' : 'pause'" />
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" @click="nextGroup" :title="$t('Next Group')">
                        <font-awesome-icon icon="step-forward" />
                    </button>
                    <select v-model="interval" class="form-select form-select-sm">
                        <option value="5000">5s</option>
                        <option value="10000">10s</option>
                        <option value="15000">15s</option>
                    </select>
                    
                    <button class="btn btn-sm btn-outline-secondary" @click="showGridConfig = true" :title="$t('Configure Grid Layout')">
                        <font-awesome-icon icon="cog" />
                    </button>
                </div>
            </div>
            
            <div class="group-list">
                <div 
                    v-for="(group, index) in groups" 
                    :key="group.id"
                    class="group-item"
                    :class="{ 'active': currentGroupIndex === index }"
                    @click="selectGroup(index)"
                >
                    <div class="group-name">{{ group.name }}</div>
                    <div class="group-count">
                        {{ getMonitorsInGroup(group.id).length }} {{ $t("Monitors") }}
                    </div>
                </div>
                
                <div v-if="groups.length === 0" class="no-groups">
                    <p>{{ $t("No Groups") }}</p>
                    <p>{{ $t("Create groups to use Auto Scroll") }}</p>
                </div>
            </div>
        </div>
        
        <!-- Zone principale avec les moniteurs du groupe sélectionné -->
        <div class="main-content">
            <div class="group-header" v-if="currentGroup">
                <h2>{{ currentGroup.name }}</h2>
            </div>
            
            <div class="monitors-list">
                <div v-if="currentMonitors.length === 0" class="no-monitors">
                    <p>{{ $t("No monitors in this group") }}</p>
                </div>
                <div v-else class="monitors-grid">
                    <div 
                        v-for="monitor in currentMonitors" 
                        :key="monitor.id"
                        class="monitor-card"
                        :class="{ 'inactive': !monitor.active, 'monitor-down': getMonitorStatus(monitor) === 0 }"
                    >
                        <div class="monitor-card-header">
                            <div class="monitor-name">{{ monitor.name }}</div>
                            <div class="monitor-status">
                                <span class="badge" :class="getStatusClass(monitor)">
                                    {{ getStatusText(monitor) }}
                                </span>
                            </div>
                        </div>
                        <div class="monitor-card-chart">
                            <HeartbeatMiniGraph :heartbeats="getHeartbeats(monitor.id)" />
                        </div>
                        <div class="monitor-card-footer">
                            <div class="monitor-last-check">
                                {{ getHeartbeatTime(monitor) }}
                            </div>
                            <div class="monitor-message">
                                {{ getStatusMessage(monitor) }}
                            </div>
                            <div class="monitor-progress-bar">
                                <div class="progress-dots">
                                    <div class="progress-fill" 
                                         :class="getProgressClass(monitor)"
                                         :style="getProgressStyle(monitor)"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal de configuration de la grille -->
    <GridConfigDialog 
        :show="showGridConfig" 
        viewType="autoscroll"
        @close="showGridConfig = false"
        @grid-updated="updateGridConfig" 
    />
</template>

<script>
import HeartbeatMiniGraph from "./HeartbeatMiniGraph.vue";
import GridConfigDialog from "./GridConfigDialog.vue";

export default {
    components: {
        HeartbeatMiniGraph,
        GridConfigDialog
    },
    data() {
        return {
            currentGroupIndex: 0,
            isPaused: false,
            interval: 10000,
            timer: null,
            showGridConfig: false, // Contrôle l'affichage de la fenêtre de configuration de la grille
            gridConfig: null // Configuration de la grille (chargée depuis localStorage)
        };
    },
    computed: {
        // Liste des groupes
        groups() {
            return Object.values(this.$root.monitorList || {})
                .filter(monitor => monitor.type === "group")
                .sort((a, b) => a.name.localeCompare(b.name));
        },
        
        // Groupe actuel
        currentGroup() {
            if (this.groups.length === 0) return null;
            return this.groups[this.currentGroupIndex];
        },
        
        // Moniteurs du groupe actuel
        currentMonitors() {
            if (!this.currentGroup) return [];
            
            return Object.values(this.$root.monitorList || {})
                .filter(monitor => monitor.parent === this.currentGroup.id && monitor.type !== "group")
                .sort((a, b) => a.name.localeCompare(b.name));
        }
    },
    watch: {
        // Surveiller le changement de groupe pour réappliquer la configuration de grille
        currentGroup() {
            this.$nextTick(() => {
                this.applyGridConfig();
            });
        }
    },
    mounted() {
        // Démarrer le timer
        this.startTimer();
        
        // Charger et appliquer la configuration de la grille
        this.applyGridConfig();
    },
    beforeUnmount() {
        // Arrêter le timer
        this.stopTimer();
    },
    methods: {
        // Toggle pause/play
        togglePause() {
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                this.stopTimer();
            } else {
                this.startTimer();
            }
        },
        
        // Démarrer le timer pour le défilement automatique
        startTimer() {
            if (this.timer) {
                clearInterval(this.timer);
            }
            
            this.timer = setInterval(() => {
                this.nextGroup();
            }, parseInt(this.interval));
        },
        
        // Arrêter le timer
        stopTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        
        // Passer au groupe suivant
        nextGroup() {
            if (this.groups.length === 0) return;
            
            this.currentGroupIndex = (this.currentGroupIndex + 1) % this.groups.length;
        },
        
        // Sélectionner un groupe spécifique
        selectGroup(index) {
            this.currentGroupIndex = index;
        },
        
        // Obtenir les moniteurs d'un groupe spécifique
        getMonitorsInGroup(groupId) {
            return Object.values(this.$root.monitorList || {})
                .filter(monitor => monitor.parent === groupId && monitor.type !== "group");
        },
        
        // Obtenir la classe CSS pour le statut du moniteur
        getStatusClass(monitor) {
            if (!monitor.active) return 'bg-secondary';
            
            const heartbeats = this.$root.heartbeatList[monitor.id];
            if (!heartbeats || !heartbeats.length) return 'bg-secondary';
            
            const lastStatus = heartbeats[0].status;
            
            switch (lastStatus) {
                case 0: return 'bg-danger';
                case 1: return 'bg-success';
                case 2: return 'bg-warning';
                default: return 'bg-secondary';
            }
        },
        
        // Obtenir le texte du statut du moniteur
        getStatusText(monitor) {
            if (!monitor.active) return this.$t('Inactive');
            
            const heartbeats = this.$root.heartbeatList[monitor.id];
            if (!heartbeats || !heartbeats.length) return this.$t('Unknown');
            
            const lastStatus = heartbeats[0].status;
            
            switch (lastStatus) {
                case 0: return this.$t('Down');
                case 1: return this.$t('Up');
                case 2: return this.$t('Pending');
                default: return this.$t('Unknown');
            }
        },
        
        // Obtenir l'heure du dernier heartbeat
        getHeartbeatTime(monitor) {
            const heartbeats = this.$root.heartbeatList[monitor.id];
            if (!heartbeats || !heartbeats.length) return '-';
            
            const timestamp = heartbeats[0].time;
            return new Date(timestamp).toLocaleTimeString();
        },
        
        // Obtenir le message du statut
        getStatusMessage(monitor) {
            if (!monitor.active) return this.$t('Paused');
            
            const heartbeats = this.$root.heartbeatList[monitor.id];
            if (!heartbeats || !heartbeats.length) return '-';
            
            return heartbeats[0].msg || '-';
        },
        
        // Obtenir le statut actuel du moniteur (0 = down, 1 = up, etc.)
        getMonitorStatus(monitor) {
            if (!monitor.active) return null;
            
            const heartbeats = this.$root.heartbeatList[monitor.id];
            if (!heartbeats || !heartbeats.length) return null;
            
            return heartbeats[0].status;
        },
        
        // Obtenir la classe CSS pour la barre de progression
        getProgressClass(monitor) {
            if (!monitor.active) return 'bg-secondary';
            
            const heartbeats = this.$root.heartbeatList[monitor.id];
            if (!heartbeats || !heartbeats.length) return 'bg-secondary';
            
            const lastStatus = heartbeats[0].status;
            
            switch (lastStatus) {
                case 0: return 'bg-danger';
                case 1: return 'bg-success';
                case 2: return 'bg-warning';
                default: return 'bg-secondary';
            }
        },
        
        // Obtenir le style pour la barre de progression (largeur en %)
        getProgressStyle(monitor) {
            // Utiliser l'uptime comme approximation pour la largeur
            if (!monitor.active) return { width: '0%' };
            
            // Uptime approximatif sur 24h
            const uptime = monitor['24_uptime'] || 0;
            return { width: `${uptime}%` };
        },
        
        // Obtenir les heartbeats d'un moniteur
        getHeartbeats(monitorId) {
            const heartbeats = this.$root.heartbeatList?.[monitorId] || [];
            return heartbeats;
        },
        
        /**
         * Mettre à jour la configuration de la grille
         * @param {Object} config - La nouvelle configuration
         * @returns {void}
         */
        updateGridConfig(config) {
            this.gridConfig = config;
            
            // Sauvegarder la configuration dans localStorage
            localStorage.setItem('autoscrollGridConfig', JSON.stringify(config));
            
            // Appliquer la nouvelle configuration à la grille
            this.applyGridConfig();
        },
        
        /**
         * Appliquer la configuration de la grille aux cartes de moniteurs
         * @returns {void}
         */
        applyGridConfig() {
            if (!this.gridConfig) {
                // Charger la configuration depuis localStorage si disponible
                const savedConfig = localStorage.getItem('autoscrollGridConfig');
                if (savedConfig) {
                    this.gridConfig = JSON.parse(savedConfig);
                } else {
                    // Configuration par défaut
                    this.gridConfig = {
                        cardSize: 320,
                        cardsPerRow: 3,
                        cardGap: 15
                    };
                }
            }
            
            // Appliquer les styles CSS à la grille
            this.$nextTick(() => {
                const gridContainer = document.querySelector('.monitors-grid');
                if (gridContainer) {
                    // Configurer la grille en utilisant CSS Grid
                    gridContainer.style.display = 'grid';
                    gridContainer.style.gridTemplateColumns = `repeat(${this.gridConfig.cardsPerRow}, ${this.gridConfig.cardSize}px)`;
                    gridContainer.style.gap = `${this.gridConfig.cardGap}px`;
                    
                    // Appliquer les styles aux cartes individuelles
                    const cards = document.querySelectorAll('.monitor-card');
                    cards.forEach(card => {
                        card.style.width = `${this.gridConfig.cardSize}px`;
                        card.style.height = 'auto';
                    });
                }
            });
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.auto-scroll-container {
    display: flex;
    width: 100%;
    height: 100%;
}

/* Barre latérale */
.sidebar {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
    border-right: 1px solid #ddd;
    overflow: hidden;
    
    .dark & {
        background-color: #222;
        border-right-color: #333;
    }
}

.sidebar-header {
    padding: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ddd;
    
    h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #444;
        
        .dark & {
            color: #eee;
        }
    }
    
    .controls {
        display: flex;
        gap: 5px;
        
        .btn {
            padding: 4px 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            
            &:hover {
                background-color: $primary;
                color: white;
                
                .dark & {
                    background-color: $primary;
                }
            }
        }
        
        .form-select {
            padding: 4px 8px;
            height: auto;
            font-size: 0.9rem;
        }
    }
    
    .dark & {
        border-bottom-color: #333;
    }
}

.group-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.group-item {
    padding: 10px;
    margin-bottom: 8px;
    border-radius: 5px;
    background-color: white;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    
    &:hover {
        background-color: #f0f9ff;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    }
    
    &.active {
        background-color: rgba($primary, 0.1);
        border-left: 3px solid $primary;
        padding-left: 7px;
        
        .group-name {
            color: $primary;
            font-weight: 600;
        }
    }
    
    .group-name {
        font-weight: 500;
        color: #333;
        margin-bottom: 3px;
    }
    
    .group-count {
        font-size: 0.85rem;
        color: #777;
    }
    
    .dark & {
        background-color: #333;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        
        &:hover {
            background-color: #3a3a3a;
        }
        
        &.active {
            background-color: rgba($primary, 0.2);
        }
        
        .group-name {
            color: #eee;
        }
        
        .group-count {
            color: #999;
        }
    }
}

.no-groups {
    text-align: center;
    padding: 20px;
    color: #777;
    
    .dark & {
        color: #999;
    }
}

/* Zone principale */
.main-content {
    flex: 1;
    padding: 20px;
    background-color: #fff;
    overflow-y: auto;
    
    .dark & {
        background-color: #1e1e1e;
    }
}

.group-header {
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
    
    h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
        
        .dark & {
            color: #eee;
        }
    }
    
    .dark & {
        border-bottom-color: #333;
    }
}

.monitors-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.monitors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
    /* Les styles seront écrasés par applyGridConfig() */
}

/* Styles pour les cartes de moniteur */
.monitor-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 140px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 10px;
    background-color: white;
    
    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
    }
    
    &.monitor-down {
        border-left: 4px solid $danger;
    }
    
    &.inactive {
        opacity: 0.6;
    }
    
    .dark & {
        background-color: #2a2a2a;
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
        margin-bottom: 10px;
        
        .monitor-name {
            font-weight: bold;
            font-size: 1rem;
            color: $success;
            
            .dark & {
                color: lighten($success, 10%);
            }
        }
    }
    
    .monitor-card-chart {
        flex-grow: 1;
        min-height: 90px;
        margin-bottom: 10px;
    }
    
    .monitor-card-footer {
        font-size: 0.85rem;
        margin-top: auto;
        
        .monitor-last-check {
            font-weight: 500;
            color: #666;
            
            .dark & {
                color: #aaa;
            }
        }
        
        .monitor-message {
            color: #777;
            margin: 5px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            
            .dark & {
                color: #999;
            }
        }
        
        .monitor-progress-bar {
            margin-top: 8px;
            
            .progress-dots {
                position: relative;
                height: 6px;
                background: rgba(0, 0, 0, 0.05);
                border-radius: 10px;
                overflow: hidden;
                
                .dark & {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .progress-fill {
                    position: absolute;
                    top: 0;
                    left: 0;
                    height: 100%;
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }
            }
        }
    }
}

/* Animation de clignotement pour les moniteurs DOWN */
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

.monitor-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    
    &:hover {
        background-color: #f0f9ff;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    }
    
    &.inactive {
        opacity: 0.6;
    }
    
    .monitor-name {
        font-weight: 500;
        color: #333;
    }
    
    .badge {
        padding: 5px 10px;
        font-size: 0.85rem;
    }
    
    .dark & {
        background-color: #2a2a2a;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        
        &:hover {
            background-color: #333;
        }
        
        .monitor-name {
            color: #eee;
        }
    }
}

.no-monitors {
    text-align: center;
    padding: 30px;
    color: #777;
    background-color: #f8f9fa;
    border-radius: 5px;
    
    .dark & {
        color: #999;
        background-color: #2a2a2a;
    }
}

/* Responsive */
@media (max-width: 768px) {
    .auto-scroll-container {
        flex-direction: column;
    }
    
    .sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid #ddd;
        
        .dark & {
            border-bottom-color: #333;
        }
    }
    
    .main-content {
        padding: 15px;
    }
}
</style>