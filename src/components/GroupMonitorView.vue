<template>
    <div class="group-monitor-view">
        <div class="header-controls">
            <div class="group-title">
                <h2 v-if="currentGroup">{{ currentGroup.name }}</h2>
                <h2 v-else>{{ $t('All Monitors') }}</h2>
            </div>
            
            <div class="actions">
                <button class="btn btn-sm btn-success" @click="$router.push('/add')">
                    <font-awesome-icon icon="plus" /> {{ $t('Add') }}
                </button>
                
                <div class="filter-controls">
                    <select v-model="activeFilter" class="form-select form-select-sm">
                        <option value="all">{{ $t('All') }}</option>
                        <option value="active">{{ $t('Active') }}</option>
                        <option value="inactive">{{ $t('Inactive') }}</option>
                    </select>
                    
                    <div class="search-input-wrapper">
                        <input 
                            v-model="searchText" 
                            type="text" 
                            class="form-control form-control-sm" 
                            :placeholder="$t('Search...')"
                        >
                        <button v-if="searchText" @click="searchText = ''" class="clear-btn">
                            <font-awesome-icon icon="times" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="monitors-table">
            <table class="table">
                <thead>
                    <tr>
                        <th>{{ $t('Name') }}</th>
                        <th>{{ $t('Status') }}</th>
                        <th>{{ $t('Time') }}</th>
                        <th>{{ $t('Messages') }}</th>
                        <th>{{ $t('Progress') }}</th>
                        <th>{{ $t('Graph') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="filteredMonitors.length === 0" class="empty-state">
                        <td colspan="6" class="text-center py-4">
                            <div v-if="searchText || activeFilter !== 'all'">
                                {{ $t('No Monitors match your filters') }}
                            </div>
                            <div v-else-if="currentGroup">
                                {{ $t('No Monitors in this group') }}
                            </div>
                            <div v-else>
                                {{ $t('No Monitors found') }}
                            </div>
                        </td>
                    </tr>
                    
                    <tr v-for="monitor in filteredMonitors" :key="monitor.id" 
                        class="monitor-row" 
                        :class="{'inactive': !monitor.active}"
                        @click="goToMonitor(monitor.id)"
                    >
                        <td class="name-cell">
                            <router-link :to="monitorURL(monitor.id)">{{ monitor.name }}</router-link>
                        </td>
                        <td class="status-cell">
                            <span class="badge" :class="getStatusClass(monitor)">
                                {{ monitor.active ? $t('Active') : $t('Inactive') }}
                            </span>
                        </td>
                        <td class="time-cell">
                            {{ getHeartbeatTime(monitor) }}
                        </td>
                        <td class="message-cell">
                            {{ getStatusMessage(monitor) }}
                        </td>
                        <td class="progress-cell">
                            <div class="progress">
                                <div class="progress-bar" :class="getProgressClass(monitor)" :style="getProgressStyle(monitor)"></div>
                            </div>
                        </td>
                        <td class="graph-cell">
                            <HeartbeatMiniGraph :monitor-id="monitor.id" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
import { getMonitorRelativeURL } from "../util.ts";
import HeartbeatMiniGraph from "./HeartbeatMiniGraph.vue";

export default {
    components: {
        HeartbeatMiniGraph
    },
    props: {
        groupId: {
            type: [Number, String, null],
            default: null
        },
        autoScrollMode: {
            type: Boolean,
            default: false
        },
        currentGroupIndex: {
            type: Number,
            default: null
        }
    },
    data() {
        return {
            searchText: "",
            activeFilter: "all"
        };
    },
    computed: {
        // Si on est en mode défilement auto, utiliser le groupId fourni par le parent
        // Sinon, utiliser le groupId depuis les props (venant de la route)
        activeGroupId() {
            if (this.autoScrollMode && this.currentGroup) {
                return this.currentGroup.id;
            }
            return this.groupId;
        },
        
        // En mode auto-scroll, récupérer le groupe actuel à partir de l'index
        currentGroup() {
            if (!this.autoScrollMode || this.currentGroupIndex === null) {
                return this.groupId ? this.$root.monitorList[this.groupId] : null;
            }
            
            const groups = this.groups;
            if (groups.length === 0 || this.currentGroupIndex >= groups.length) {
                return null;
            }
            
            return groups[this.currentGroupIndex];
        },
        
        // Liste de tous les groupes
        groups() {
            return Object.values(this.$root.monitorList).filter(monitor => 
                monitor.type === "group"
            );
        },
        
        // Tous les moniteurs du système
        allMonitors() {
            return Object.values(this.$root.monitorList);
        },
        
        // Moniteurs du groupe actuel
        groupMonitors() {
            if (!this.activeGroupId) {
                // Si pas de groupe, afficher tous les moniteurs qui ne sont pas des groupes
                return this.allMonitors.filter(monitor => 
                    monitor.type !== "group"
                );
            }
            
            return this.allMonitors.filter(monitor => 
                monitor.parent === this.activeGroupId
            );
        },
        
        // Moniteurs filtrés
        filteredMonitors() {
            let result = this.groupMonitors;
            
            // Filter by active status
            if (this.activeFilter === 'active') {
                result = result.filter(monitor => monitor.active);
            } else if (this.activeFilter === 'inactive') {
                result = result.filter(monitor => !monitor.active);
            }
            
            // Filter by search text
            if (this.searchText) {
                const searchLower = this.searchText.toLowerCase();
                result = result.filter(monitor => 
                    monitor.name.toLowerCase().includes(searchLower)
                );
            }
            
            // Sort by name
            return result.sort((a, b) => {
                if (a.active !== b.active) {
                    return a.active ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
        }
    },
    methods: {
        monitorURL(id) {
            return `/dashboard/${id}`;
        },
        
        goToMonitor(id) {
            this.$router.push(this.monitorURL(id));
        },
        
        getStatusClass(monitor) {
            if (!monitor.active) return 'bg-secondary';
            
            const heartbeat = this.$root.heartbeatList[monitor.id];
            if (!heartbeat || !heartbeat.length) return 'bg-warning';
            
            const lastStatus = heartbeat[0].status;
            
            switch (lastStatus) {
                case 0:
                    return 'bg-danger';
                case 1:
                    return 'bg-success';
                case 2:
                    return 'bg-warning';
                default:
                    return 'bg-secondary';
            }
        },
        
        getProgressClass(monitor) {
            if (!monitor.active) return 'bg-secondary';
            
            const heartbeat = this.$root.heartbeatList[monitor.id];
            if (!heartbeat || !heartbeat.length) return 'bg-warning';
            
            const lastStatus = heartbeat[0].status;
            
            switch (lastStatus) {
                case 0:
                    return 'bg-danger';
                case 1:
                    return 'bg-success';
                case 2:
                    return 'bg-warning';
                default:
                    return 'bg-secondary';
            }
        },
        
        getProgressStyle(monitor) {
            // Calculer un pourcentage basé sur l'uptime
            if (!monitor.active) return { width: '0%' };
            
            const heartbeat = this.$root.heartbeatList[monitor.id];
            if (!heartbeat || !heartbeat.length) return { width: '0%' };
            
            // Utiliser 24_uptime comme approximation
            const uptime = monitor['24_uptime'] || 0;
            return { width: `${uptime}%` };
        },
        
        getHeartbeatTime(monitor) {
            const heartbeat = this.$root.heartbeatList[monitor.id];
            if (!heartbeat || !heartbeat.length) return '-';
            
            const timestamp = heartbeat[0].time;
            return new Date(timestamp).toLocaleTimeString();
        },
        
        getStatusMessage(monitor) {
            if (!monitor.active) return this.$t('Paused');
            
            const heartbeat = this.$root.heartbeatList[monitor.id];
            if (!heartbeat || !heartbeat.length) return '-';
            
            const lastMsg = heartbeat[0].msg;
            
            if (monitor.type === 'http' || monitor.type === 'keyword') {
                const statusCode = lastMsg.match(/^[0-9]{3}/);
                if (statusCode) {
                    return statusCode[0] + ' - OK';
                }
            }
            
            return lastMsg || '-';
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.group-monitor-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: white;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    
    .dark & {
        background-color: $dark-bg;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
}

.header-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .group-title {
        h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: $primary;
            
            .dark & {
                color: lighten($primary, 15%);
            }
        }
    }
    
    .actions {
        display: flex;
        align-items: center;
        gap: 15px;
        
        .btn-success {
            background-color: $success;
            border-color: $success;
            
            &:hover {
                background-color: darken($success, 5%);
                border-color: darken($success, 5%);
            }
        }
    }
    
    .filter-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        
        .form-select {
            width: auto;
            min-width: 100px;
        }
        
        .search-input-wrapper {
            position: relative;
            width: 200px;
            
            .form-control {
                padding-right: 30px;
            }
            
            .clear-btn {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 0;
                font-size: 0.9rem;
                
                &:hover {
                    color: #333;
                }
                
                .dark & {
                    color: #aaa;
                    
                    &:hover {
                        color: #eee;
                    }
                }
            }
        }
    }
}

.monitors-table {
    flex: 1;
    overflow-y: auto;
    margin-top: 10px;
    
    .table {
        margin-bottom: 0;
        
        th {
            position: sticky;
            top: 0;
            background-color: white;
            z-index: 10;
            font-size: 0.9rem;
            font-weight: 600;
            color: #555;
            padding: 10px;
            border-bottom: 2px solid #f0f0f0;
            
            .dark & {
                background-color: $dark-bg;
                color: #ddd;
                border-bottom-color: #2a2a2a;
            }
        }
        
        .monitor-row {
            cursor: pointer;
            transition: all 0.2s ease;
            
            &:hover {
                background-color: rgba($success, 0.05);
                
                .dark & {
                    background-color: rgba($success, 0.1);
                }
            }
            
            &.inactive {
                opacity: 0.7;
                
                &:hover {
                    opacity: 0.9;
                }
            }
            
            td {
                padding: 12px 10px;
                vertical-align: middle;
                border-bottom: 1px solid #f5f5f5;
                
                .dark & {
                    border-bottom-color: #2a2a2a;
                }
            }
        }
        
        .name-cell {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            
            a {
                color: $primary;
                text-decoration: none;
                font-weight: 500;
                
                &:hover {
                    text-decoration: underline;
                }
                
                .dark & {
                    color: lighten($primary, 15%);
                }
            }
        }
        
        .status-cell {
            width: 90px;
            text-align: center;
            
            .badge {
                font-size: 0.8rem;
                padding: 5px 8px;
                border-radius: 4px;
            }
        }
        
        .time-cell {
            width: 100px;
            font-size: 0.9rem;
            color: #666;
            
            .dark & {
                color: #bbb;
            }
        }
        
        .message-cell {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 0.9rem;
            color: #666;
            
            .dark & {
                color: #bbb;
            }
        }
        
        .progress-cell {
            width: 150px;
            
            .progress {
                height: 8px;
                background-color: rgba(0, 0, 0, 0.05);
                
                .dark & {
                    background-color: rgba(255, 255, 255, 0.1);
                }
            }
        }
        
        .graph-cell {
            width: 100px;
            text-align: center;
        }
        
        .empty-state {
            td {
                font-size: 1rem;
                color: #888;
                
                .dark & {
                    color: #aaa;
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .header-controls {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
        
        .actions {
            width: 100%;
            flex-wrap: wrap;
        }
        
        .filter-controls {
            width: 100%;
            
            .search-input-wrapper {
                flex: 1;
            }
        }
    }
    
    .monitors-table {
        overflow-x: auto;
        
        .table {
            min-width: 650px;
        }
    }
}
</style>