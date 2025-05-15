<template>
    <div class="group-selector">
        <div class="header">
            <h3>{{ $t("Groups") }}</h3>
            <div class="controls">
                <button 
                    class="btn control-btn"
                    @click="togglePause"
                >
                    <font-awesome-icon :icon="isPaused ? 'play' : 'pause'" />
                </button>
                <button 
                    class="btn control-btn"
                    @click="showNextGroup"
                >
                    <font-awesome-icon icon="step-forward" />
                </button>
                
                <div class="interval-selector">
                    <select v-model="interval" class="form-select">
                        <option value="5000">5s</option>
                        <option value="10000">10s</option>
                        <option value="15000">15s</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div v-if="groupedMonitors.length === 0" class="no-groups-message">
            <div class="text-center p-3">
                <div class="mb-3">{{ $t("No Groups") }}</div>
                <p class="mb-2">Pour tester cette fonctionnalité, vous devez d'abord créer des groupes:</p>
                <ol class="text-start instruction-list">
                    <li>Cliquez sur <strong>+Ajouter</strong> pour créer une nouvelle sonde</li>
                    <li>Sélectionnez le type <strong>Group</strong></li>
                    <li>Donnez un nom au groupe (ex: "Bureau", "Datacenter", "Production")</li>
                    <li>Créez plusieurs groupes pour tester le défilement automatique</li>
                </ol>
            </div>
        </div>
        
        <div v-else class="group-list">
            <div 
                v-for="(group, index) in groupedMonitors" 
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
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            currentGroupIndex: null,
            isPaused: false,
            interval: localStorage.getItem('autoScrollInterval') || 10000,
            timer: null
        };
    },
    computed: {
        // Group monitors by parent
        groupedMonitors() {
            const groups = Object.values(this.$root.monitorList).filter(monitor => monitor.type === "group");
            return groups;
        },
        
        // Current group being displayed
        currentGroup() {
            if (this.currentGroupIndex === null || this.groupedMonitors.length === 0) {
                return null;
            }
            return this.groupedMonitors[this.currentGroupIndex];
        },
        
        // ID du groupe actuel
        currentGroupId() {
            return this.currentGroup ? this.currentGroup.id : null;
        }
    },
    watch: {
        interval(newVal) {
            localStorage.setItem('autoScrollInterval', newVal);
            this.resetTimer();
        },
        
        groupedMonitors: {
            immediate: true,
            handler(newVal) {
                if (newVal.length > 0 && this.currentGroupIndex === null) {
                    this.currentGroupIndex = 0;
                    this.$emit('group-selected', this.currentGroupId);
                } else if (newVal.length === 0) {
                    this.currentGroupIndex = null;
                    this.$emit('group-selected', null);
                }
            }
        },
        
        currentGroupId: {
            handler(newVal) {
                this.$emit('group-selected', newVal);
            }
        }
    },
    mounted() {
        this.startAutoScroll();
    },
    beforeUnmount() {
        this.stopAutoScroll();
    },
    methods: {
        togglePause() {
            this.isPaused = !this.isPaused;
            
            if (this.isPaused) {
                this.stopAutoScroll();
            } else {
                this.startAutoScroll();
            }
        },
        
        startAutoScroll() {
            if (this.timer) {
                clearInterval(this.timer);
            }
            
            this.timer = setInterval(() => {
                this.showNextGroup();
            }, parseInt(this.interval));
        },
        
        stopAutoScroll() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        },
        
        resetTimer() {
            this.stopAutoScroll();
            if (!this.isPaused) {
                this.startAutoScroll();
            }
        },
        
        showNextGroup() {
            if (this.groupedMonitors.length === 0) {
                return;
            }
            
            if (this.currentGroupIndex === null) {
                this.currentGroupIndex = 0;
            } else {
                this.currentGroupIndex = (this.currentGroupIndex + 1) % this.groupedMonitors.length;
            }
        },
        
        selectGroup(index) {
            this.currentGroupIndex = index;
            this.resetTimer(); // Réinitialiser le timer quand on clique sur un groupe
        },
        
        // Récupérer les moniteurs d'un groupe spécifique
        getMonitorsInGroup(groupId) {
            return Object.values(this.$root.monitorList).filter(monitor => 
                monitor.parent === groupId
            );
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.group-selector {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.header {
    padding: 15px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: $primary;
        
        .dark & {
            color: lighten($primary, 15%);
        }
    }
    
    .controls {
        display: flex;
        align-items: center;
        
        .control-btn {
            width: 36px;
            height: 36px;
            padding: 0;
            margin-left: 8px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 8px;
            background-color: white;
            color: #555;
            border: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
            transition: all 0.2s ease;
            
            &:hover {
                background-color: rgba($success, 0.1);
                color: $success;
                transform: translateY(-2px);
                box-shadow: 0 4px 10px rgba($success, 0.15);
            }
            
            .dark & {
                background-color: rgba(255, 255, 255, 0.08);
                color: rgba(255, 255, 255, 0.9);
                border-color: rgba(255, 255, 255, 0.1);
                
                &:hover {
                    background-color: rgba($success, 0.2);
                    color: white;
                    box-shadow: 0 4px 8px rgba($success, 0.3);
                }
            }
        }
        
        .interval-selector {
            width: 60px;
            margin-left: 8px;
            
            .form-select {
                border-radius: 8px;
                border: 1px solid rgba(0, 0, 0, 0.1);
                background-color: white;
                font-size: 0.9rem;
                padding: 4px 8px;
                height: 36px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
                
                .dark & {
                    background-color: rgba(255, 255, 255, 0.08);
                    color: rgba(255, 255, 255, 0.9);
                    border-color: rgba(255, 255, 255, 0.1);
                }
            }
        }
    }
}

.group-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.group-item {
    padding: 12px 15px;
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.02);
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
        background-color: rgba($success, 0.1);
        box-shadow: 0 2px 8px rgba($success, 0.15);
        transform: translateY(-2px);
    }
    
    &.active {
        background-color: rgba($success, 0.15);
        border-left: 3px solid $success;
        
        .group-name {
            color: darken($success, 5%);
            font-weight: 600;
        }
        
        .dark & {
            background-color: rgba($success, 0.25);
            
            .group-name {
                color: lighten($success, 15%);
            }
        }
    }
    
    .dark & {
        background-color: rgba(255, 255, 255, 0.05);
        
        &:hover {
            background-color: rgba($success, 0.15);
            box-shadow: 0 2px 8px rgba($success, 0.3);
        }
    }
    
    .group-name {
        font-size: 1rem;
        font-weight: 500;
        color: #444;
        margin-bottom: 4px;
        
        .dark & {
            color: #ddd;
        }
    }
    
    .group-count {
        font-size: 0.85rem;
        color: #888;
        
        .dark & {
            color: #aaa;
        }
    }
}

.no-groups-message {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    font-size: 1.1rem;
    color: #999;
    
    .dark & {
        color: #aaa;
    }
    
    .instruction-list {
        margin-top: 15px;
        margin-left: 10px;
        padding-left: 20px;
        
        li {
            margin-bottom: 8px;
            line-height: 1.4;
            font-size: 0.95rem;
            
            strong {
                color: $success;
                font-weight: 600;
                
                .dark & {
                    color: lighten($success, 15%);
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        
        .controls {
            width: 100%;
            justify-content: flex-end;
        }
    }
}
</style>