<template>
    <transition name="slide-fade" appear>
        <div class="monitor-list-container">

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
                        </div>
                    </div>
                </div>
            </div>

            <!-- Table View -->
            <div v-if="viewMode === 'table'" class="shadow-box table-shadow-box" style="overflow-x: hidden;">
                <!-- Groupe sélectionné en tant qu'en-tête -->
                <div 
                    class="list-header" 
                    v-if="currentGroup"
                    :class="{ 'special-group-header': currentGroup.isSpecial }"
                >
                    <div class="header-top">
                        <!-- Titre du groupe -->
                        <div class="group-title">
                            <font-awesome-icon 
                                class="me-2" 
                                :icon="currentGroup.isSpecial ? 'list-alt' : 'folder'" 
                            />
                            {{ currentGroup.name }}
                            <span 
                                class="monitor-count"
                                :class="{ 'special-count': currentGroup.isSpecial }"
                            >
                                {{ monitorsInGroup.length }} {{ $t('Monitors') }}
                            </span>
                        </div>
                        
                        <div class="placeholder"></div>
                    </div>
                </div>
                
                <!-- Message d'information si aucun groupe n'est sélectionné -->
                <div class="no-group-selected" v-if="!currentGroup">
                    <p>{{ $t('No group selected') }}</p>
                    <p>{{ $t('Please select a group from the sidebar') }}</p>
                </div>
                
                <!-- Table des moniteurs (style de DashboardHome) -->
                <table v-else class="table table-borderless table-hover">
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
                            v-for="monitor in monitorsInGroup" 
                            :key="monitor.id" 
                            :class="{ 
                                'shadow-box': $root.windowWidth <= 550,
                                'monitor-down': getStatusClass(monitor) === 'status-down'
                            }"
                        >
                            <td class="name-column">
                                <div class="monitor-left">
                                    <font-awesome-icon :icon="getMonitorIcon(monitor)" class="monitor-icon me-2" />
                                    <span class="monitor-name">{{ monitor.name }}</span>
                                </div>
                            </td>
                            <td><span class="status-badge" :class="getStatusClass(monitor)">{{ getStatusText(monitor) }}</span></td>
                            <td><span v-if="monitor.lastCheck">{{ monitor.lastCheck }}</span></td>
                            <td>{{ monitor.message || '' }}</td>
                            <td class="progress-column">
                                <div class="table-progress-bar">
                                    <div class="progress-dots">
                                        <div class="progress-fill" 
                                             :class="{ 'bg-danger': getStatusClass(monitor) === 'status-down', 'bg-success': getStatusClass(monitor) === 'status-up' }"
                                             :style="{ width: getUptime(monitor) + '%' }"></div>
                                    </div>
                                </div>
                            </td>
                            <td class="chart-column">
                                <span class="response-time">
                                    <font-awesome-icon icon="tachometer-alt" class="me-1" />
                                    {{ getResponseTime(monitor) }} ms
                                </span>
                            </td>
                        </tr>

                        <tr v-if="monitorsInGroup.length === 0">
                            <td colspan="6" class="text-center py-4">
                                {{ $t("No monitors in this group") }}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="d-flex justify-content-center kuma_pagination">
                    <pagination
                        v-if="monitorsInGroup.length > perPage"
                        v-model="page"
                        :records="monitorsInGroup.length"
                        :per-page="perPage"
                        :options="paginationConfig"
                    />
                </div>
            </div>

            <!-- Card View -->
            <div v-if="viewMode === 'card'" class="card-view">
                <div v-if="!currentGroup" class="shadow-box text-center">
                    <p>{{ $t('No group selected') }}</p>
                    <p>{{ $t('Please select a group from the sidebar') }}</p>
                </div>
                <div v-else-if="monitorsInGroup.length === 0" class="shadow-box text-center">
                    {{ $t("No monitors in this group") }}
                </div>
                <div v-else class="row">
                    <div v-for="monitor in monitorsInGroup" :key="monitor.id" class="col-12 col-md-6 col-lg-4 mb-4">
                        <div class="monitor-card shadow-box" :class="{ 'monitor-down': getStatusClass(monitor) === 'status-down' }">
                            <div class="monitor-card-header">
                                <div class="monitor-name">
                                    <font-awesome-icon :icon="getMonitorIcon(monitor)" class="me-2" />
                                    {{ monitor.name }}
                                </div>
                                <Status :status="monitor.status" />
                            </div>
                            <div class="monitor-card-chart">
                                <PingChart :monitor-id="monitor.id" mini />
                            </div>
                            <div class="monitor-card-footer">
                                <div class="monitor-last-check">
                                    <span v-if="monitor.lastCheck">{{ monitor.lastCheck }}</span>
                                </div>
                                <div v-if="monitor.message" class="monitor-message mt-2">
                                    {{ monitor.message }}
                                </div>
                                <div class="monitor-progress-bar mt-2">
                                    <div class="progress-dots">
                                        <div class="progress-fill" 
                                             :class="{ 'bg-danger': getStatusClass(monitor) === 'status-down', 'bg-success': getStatusClass(monitor) === 'status-up' }"
                                             :style="{ width: getUptime(monitor) + '%' }"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-center kuma_pagination mt-3">
                    <pagination
                        v-if="monitorsInGroup.length > perPage"
                        v-model="page"
                        :records="monitorsInGroup.length"
                        :per-page="perPage"
                        :options="paginationConfig"
                    />
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import Status from "./Status.vue";
import Datetime from "./Datetime.vue";
import Pagination from "v-pagination-3";
import MonitorListFilter from "./MonitorListFilter.vue";
import PingChart from "./PingChart.vue";

export default {
    components: {
        Datetime,
        Status,
        Pagination,
        MonitorListFilter,
        PingChart,
    },
    props: {
        groupId: {
            type: Number,
            default: null
        }
    },
    data() {
        return {
            viewMode: localStorage.getItem('monitorListViewMode') || 'table', // 'table' or 'card'
            page: 1,
            perPage: 25,
            paginationConfig: {
                hideCount: true,
                chunksNavigation: "scroll",
            },
            searchText: "",
            filterState: {
                status: "all",
                type: "all"
            }
        };
    },
    computed: {
        currentGroup() {
            if (!this.groupId) return null;
            
            // Groupes spéciaux avec des ID négatifs
            if (this.groupId === -1) {
                return { 
                    id: -1, 
                    name: this.$t('All Monitors'), 
                    type: 'special-group', 
                    isSpecial: true 
                };
            }
            
            if (this.groupId === -2) {
                return { 
                    id: -2, 
                    name: this.$t('Unassigned Monitors'), 
                    type: 'special-group', 
                    isSpecial: true 
                };
            }
            
            // Groupe normal
            const foundGroup = Object.values(this.$root.monitorList || {})
                .find(m => m.id === this.groupId && m.type === "group");
            return foundGroup || null;
        },
        monitorsInGroup() {
            if (!this.groupId) return [];
            
            const allMonitors = Object.values(this.$root.monitorList || {});
            
            // Afficher tous les moniteurs (sauf les groupes)
            if (this.groupId === -1) {
                return allMonitors
                    .filter(m => m.type !== "group")
                    .sort((a, b) => a.name.localeCompare(b.name));
            }
            
            // Afficher les moniteurs non assignés à un groupe
            if (this.groupId === -2) {
                return allMonitors
                    .filter(m => 
                        m.type !== "group" && 
                        (!m.parent || !allMonitors.find(g => g.id === m.parent && g.type === "group"))
                    )
                    .sort((a, b) => a.name.localeCompare(b.name));
            }
            
            // Afficher les moniteurs du groupe spécifié
            return allMonitors
                .filter(m => m.parent === this.groupId)
                .sort((a, b) => a.name.localeCompare(b.name));
        }
    },
    watch: {
        page() {
            // Reset to page 1 when filters change
            localStorage.setItem('monitorListPage', this.page);
        },
    },
    
    mounted() {
        // Restore page from localStorage if available
        const savedPage = localStorage.getItem('monitorListPage');
        if (savedPage) {
            this.page = parseInt(savedPage, 10);
        }
    },
    
    methods: {
        changeViewMode(mode) {
            this.viewMode = mode;
            localStorage.setItem('monitorListViewMode', mode);
        },
        
        updateFilter(newFilterState) {
            this.filterState = { ...newFilterState };
            this.page = 1; // Reset to first page when filter changes
        },
        
        onSearchInput() {
            this.page = 1; // Reset to first page when search changes
            // Debounce search if needed
        },
        
        clearSearch() {
            this.searchText = "";
            this.page = 1; // Reset to first page when search is cleared
        },
        
        getStatusClass(monitor) {
            if (!monitor.active) return 'status-inactive';
            
            if (monitor.status === 'up') {
                return 'status-up';
            } else if (monitor.status === 'down') {
                return 'status-down';
            } else if (monitor.status === 'pending') {
                return 'status-pending';
            } else {
                return 'status-unknown';
            }
        },
        
        getStatusText(monitor) {
            if (!monitor.active) return this.$t('Inactive');
            
            if (monitor.status === 'up') {
                return this.$t('Up');
            } else if (monitor.status === 'down') {
                return this.$t('Down');
            } else if (monitor.status === 'pending') {
                return this.$t('Pending');
            } else {
                return this.$t('Unknown');
            }
        },
        
        getUptime(monitor) {
            if (!monitor.uptime) return '?';
            // Affiche uptime avec 2 décimales
            return monitor.uptime.toFixed(2);
        },
        
        getResponseTime(monitor) {
            if (!monitor.ping) return '?';
            // Arrondir à l'entier le plus proche
            return Math.round(monitor.ping);
        },
        
        getMonitorIcon(monitor) {
            // Retourne l'icône appropriée selon le type de moniteur
            switch (monitor.type) {
                case "http":
                case "keyword":
                case "json-query":
                    return "globe";
                case "port":
                    return "wrench";
                case "ping":
                    return "heartbeat";
                case "dns":
                    return "unlink";
                case "push":
                    return "arrow-up";
                case "steam":
                    return "cog";
                case "docker":
                    return "cog";
                case "mqtt":
                    return "stream";
                case "sqlserver":
                case "postgres":
                case "mysql":
                case "mongodb":
                    return "table";
                case "grpc":
                    return "server";
                case "radius":
                    return "cog";
                case "group":
                    return "folder";
                default:
                    return "server";
            }
        },
        
        getMonitorType(monitor) {
            // Retourne le type du moniteur en format lisible
            switch (monitor.type) {
                case "http":
                    return "HTTP";
                case "keyword":
                    return "HTTP (Keyword)";
                case "ping":
                    return "Ping";
                case "port":
                    return "Port";
                case "dns":
                    return "DNS";
                case "push":
                    return "Push";
                case "steam":
                    return "Steam";
                case "docker":
                    return "Docker";
                case "mqtt":
                    return "MQTT";
                case "sqlserver":
                    return "SQL Server";
                case "postgres":
                    return "PostgreSQL";
                case "mysql":
                    return "MySQL";
                case "mongodb":
                    return "MongoDB";
                case "grpc":
                    return "gRPC";
                case "radius":
                    return "RADIUS";
                case "json-query":
                    return "JSON Query";
                default:
                    return monitor.type ? monitor.type.toUpperCase() : "Unknown";
            }
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars";

.monitor-list-container {
    display: flex;
    flex-direction: column;
}

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

/* Monitor card styles from DashboardHome.vue */
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
            color: $success;
            text-decoration: none;
        }
    }
    
    .monitor-card-chart {
        flex-grow: 1;
        min-height: 40px;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
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
                    border-radius: 10px;
                    transition: width 0.5s ease;
                }
            }
        }
    }
}

.name-column {
    min-width: 150px;
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
            border-radius: 10px;
            transition: width 0.5s ease;
        }
    }
}

/* Existing styles from MonitorListTable.vue */
.shadow-box {
    background-color: #1e1e1e;
    color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
}

.monitor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #25252a;
}

.list-header {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding: 10px 15px;
    background-color: #25252a;
    margin-bottom: 5px;
    
    &.special-group-header {
        background-color: #2d2d35;
        border-bottom-color: rgba(59, 130, 246, 0.2);
        border-left: 2px solid #3b82f6;
        padding-left: 13px;
    }
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .group-title {
        font-size: 1rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        color: #ffffff;
        
        .monitor-count {
            margin-left: 10px;
            font-size: 0.8rem;
            color: #cccccc;
            background-color: rgba(255, 255, 255, 0.08);
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 400;
            
            &.special-count {
                background-color: rgba(59, 130, 246, 0.15);
                color: #93c5fd;
            }
        }
    }
    
    .placeholder {
        flex: 1;
    }
}

.monitor-list {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    background-color: #25252a;
}

.compact-monitor-item {
    margin-bottom: 5px;
    padding: 10px 15px;
    border-radius: 4px;
    background-color: #2d2d2d;
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .monitor-left {
        display: flex;
        align-items: center;
        gap: 10px;
        
        .monitor-icon {
            color: $dark-font-color;
            font-size: 1rem;
            width: 24px;
            text-align: center;
        }
        
        .monitor-name {
            color: $dark-font-color;
            font-weight: 600;
            font-size: 0.95rem;
        }
    }
    
    .monitor-right {
        display: flex;
        align-items: center;
        gap: 15px;
        
        > span {
            font-size: 0.85rem;
            padding: 3px 6px;
            border-radius: 4px;
            background-color: rgba(255, 255, 255, 0.08);
            color: #cccccc;
        }
    }
}

.monitor-content {
    display: flex;
    flex-direction: column;
}

.monitor-name {
    color: #ffffff;
    font-weight: 600;
    font-size: 1.1rem;
    text-decoration: none;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    
    &:hover {
        text-decoration: underline;
        color: lighten($primary, 25%);
    }
}

.monitor-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 5px;
    
    > .status-badge {
        display: inline-block;
        min-width: 70px;
        text-align: center;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.95rem;
        padding: 3px 10px;
        background-color: #232323;
        color: #cccccc;
        margin-right: 8px;
    }
}

/* Classes de statut simplifiées pour la vue compacte */
.status-up {
    background-color: rgba($success, 0.2);
    color: lighten($success, 10%);
}

.status-down {
    background-color: rgba($danger, 0.2);
    color: lighten($danger, 10%);
}

.status-pending {
    background-color: rgba($primary, 0.2);
    color: lighten($primary, 10%);
}

.status-inactive {
    background-color: rgba(#9ca3af, 0.2);
    color: #b8b8b8;
}

.status-unknown {
    background-color: rgba(#a3a3a3, 0.2);
    color: #b8b8b8;
}

.status-badge {
    font-weight: 500;
    text-transform: uppercase;
    font-size: 0.75rem !important;
    
    &.status-up {
        background-color: rgba($success, 0.25) !important;
        color: lighten($success, 20%);
    }
    
    &.status-down {
        background-color: rgba($danger, 0.25) !important;
        color: lighten($danger, 15%);
    }
    
    &.status-pending {
        background-color: rgba($primary, 0.25) !important;
        color: lighten($primary, 20%);
    }
    
    &.status-unknown, &.status-inactive {
        background-color: rgba(#999, 0.2) !important;
        color: #aaa;
    }
}

.uptime, .response-time, .monitor-type {
    color: #cccccc;
    font-weight: 500;
}

.heartbeat-mini {
    margin-top: 8px;
}

.no-group-selected, .no-monitors {
    padding: 40px 20px;
    text-align: center;
    background-color: #2d2d2d;
    border-radius: 8px;
    color: #aaaaaa;
    
    p:first-child {
        font-size: 1.2rem;
        font-weight: 500;
        margin-bottom: 10px;
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
            color: $success;
            text-decoration: none;
        }
    }
    
    .monitor-card-chart {
        flex-grow: 1;
        min-height: 40px;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
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
            border-radius: 10px;
            transition: width 0.5s ease;
        }
    }
}
</style>