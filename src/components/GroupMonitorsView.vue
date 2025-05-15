<template>
    <div class="group-monitors-view">
        <!-- Afficher le titre du groupe -->
        <div class="view-header">
            <div class="header-left">
                <h2 v-if="currentGroup">{{ currentGroup.name }}</h2>
                <h2 v-else>{{ $t('All Monitors') }}</h2>
            </div>
            
            <div class="header-right">
                <button class="btn btn-sm btn-success me-2" @click="$router.push('/add')">
                    <font-awesome-icon icon="plus" /> {{ $t('Add') }}
                </button>
                
                <div class="filters">
                    <select v-model="activeFilter" class="form-select form-select-sm">
                        <option value="all">{{ $t('All') }}</option>
                        <option value="active">{{ $t('Active') }}</option>
                        <option value="inactive">{{ $t('Inactive') }}</option>
                    </select>
                    
                    <div class="search-wrapper">
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
        
        <!-- Tableau des moniteurs -->
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
                                <div 
                                    class="progress-bar" 
                                    :class="getProgressClass(monitor)"
                                    :style="getProgressStyle(monitor)"
                                ></div>
                            </div>
                        </td>
                        <td class="graph-cell">
                            <HeartbeatMiniGraph :heartbeats="getHeartbeats(monitor.id)" />
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
import HeartbeatMiniGraph from "./HeartbeatMiniGraph.vue";

export default {
    components: {
        HeartbeatMiniGraph
    },
    props: {
        groupId: {
            type: [Number, String],
            default: null
        },
        autoScrollMode: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            searchText: "",
            activeFilter: "all"
        };
    },
    computed: {
        currentGroup() {
            if (!this.groupId) return null;
            return this.$root.monitorList[this.groupId] || null;
        },
        
        groupMonitors() {
            // Si le groupe est spécifié, retourner les moniteurs de ce groupe
            if (this.groupId) {
                return Object.values(this.$root.monitorList).filter(monitor => 
                    monitor.parent === this.groupId
                );
            }
            
            // Sinon, retourner tous les moniteurs
            return Object.values(this.$root.monitorList);
        },
        
        filteredMonitors() {
            return this.groupMonitors
                .filter(monitor => {
                    // Filtre par statut actif/inactif
                    if (this.activeFilter === "active" && !monitor.active) return false;
                    if (this.activeFilter === "inactive" && monitor.active) return false;
                    
                    // Filtre par texte de recherche
                    if (this.searchText) {
                        const searchLower = this.searchText.toLowerCase();
                        return monitor.name.toLowerCase().includes(searchLower);
                    }
                    
                    return true;
                })
                .sort((a, b) => {
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
        
        getHeartbeats(monitorId) {
            return this.$root.heartbeatList[monitorId] || [];
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

.group-monitors-view {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    
    .dark & {
        background-color: rgba(255, 255, 255, 0.03);
    }
}

.view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    
    .header-left {
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
    
    .header-right {
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
        
        .filters {
            display: flex;
            align-items: center;
            gap: 10px;
            
            .form-select {
                width: auto;
                min-width: 120px;
            }
            
            .search-wrapper {
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
}

.monitors-table {
    flex: 1;
    overflow-y: auto;
    
    .table {
        margin-bottom: 0;
        
        th {
            position: sticky;
            top: 0;
            background-color: rgba(255, 255, 255, 0.7);
            z-index: 10;
            font-size: 0.9rem;
            font-weight: 600;
            color: #555;
            padding: 12px 15px;
            border-bottom: 2px solid #f0f0f0;
            
            .dark & {
                background-color: rgba(0, 0, 0, 0.2);
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
                padding: 12px 15px;
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
    .view-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
        
        .header-right {
            width: 100%;
            flex-wrap: wrap;
            gap: 10px;
            
            .filters {
                width: 100%;
                flex-wrap: wrap;
                
                .search-wrapper {
                    flex: 1;
                    min-width: 150px;
                }
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