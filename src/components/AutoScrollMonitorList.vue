<template>
    <div class="shadow-box auto-scroll-sidebar" :style="boxStyle">
        <div class="list-header">
            <div class="header-top">
                <span class="title">{{ $t("Groups") }}</span>
                <div class="search-wrapper">
                    <form class="d-flex align-items-center">
                        <div class="position-relative flex-grow-1">
                            <input
                                v-model="searchText"
                                class="form-control search-input"
                                :placeholder="$t('Search...')"
                                :aria-label="$t('Search groups')"
                                autocomplete="off"
                            />
                            <a v-if="searchText == ''" class="search-icon position-absolute top-50 end-0 translate-middle-y me-2">
                                <font-awesome-icon icon="search" />
                            </a>
                            <a v-if="searchText != ''" class="search-icon position-absolute top-50 end-0 translate-middle-y me-2" @click="clearSearchText">
                                <font-awesome-icon icon="times" />
                            </a>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="controls">
                <button class="btn-outline-normal" @click="togglePause" :title="isPaused ? $t('Resume') : $t('Pause')">
                    <font-awesome-icon :icon="isPaused ? 'play' : 'pause'" size="sm" />
                    {{ isPaused ? $t('Resume') : $t('Pause') }}
                </button>
                <button class="btn-outline-normal" @click="nextGroup" :title="$t('Next Group')">
                    <font-awesome-icon icon="step-forward" size="sm" />
                    {{ $t('Next') }}
                </button>
                <div class="interval-container">
                    <label for="interval-select">{{ $t('Interval') }}:</label>
                    <select id="interval-select" v-model="interval" class="form-select interval-select">
                        <option value="5000">5s</option>
                        <option value="10000">10s</option>
                        <option value="15000">15s</option>
                        <option value="30000">30s</option>
                        <option value="60000">60s</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div ref="groupList" class="groups-container" :class="{ scrollbar: true }" :style="groupListStyle">
            <div v-if="groups.length === 0" class="text-center mt-3 no-groups">
                <p>{{ $t("No Groups") }}</p>
                <p>{{ $t("Create groups to use this feature") }}</p>
            </div>
            
            <div v-else class="group-list">
                <div 
                    v-for="(group, index) in groups" 
                    :key="group.id"
                    class="group-item"
                    :class="{ 
                        'active': currentGroupIndex === index,
                        'special-group': group.isSpecial
                    }"
                    @click="selectGroup(index)"
                >
                    <div class="group-item-content">
                        <font-awesome-icon 
                            class="me-2 group-icon" 
                            :icon="group.isSpecial ? 'list-alt' : 'folder'" 
                        />
                        <span class="group-name">{{ group.name }}</span>
                        <span class="group-count badge">{{ getMonitorsCount(group.id) }}</span>
                    </div>
                    <div v-if="currentGroupIndex === index && !isPaused" class="progress-bar-container">
                        <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        /** Should the scrollbar be shown */
        scrollbar: {
            type: Boolean,
            default: true
        },
    },
    data() {
        return {
            currentGroupIndex: 0,
            isPaused: false,
            interval: 10000,
            timer: null,
            progressTimer: null,
            progressPercentage: 0,
            startTime: null,
            searchText: ""
        };
    },
    computed: {
        /**
         * Fixed height for the box
         * @returns {object} Style for box
         */
        boxStyle() {
            return {
                height: "calc(100vh - 160px)",
            };
        },
        
        /**
         * Style for the group list container
         * @returns {object} Style object
         */
        groupListStyle() {
            let headerHeight = 140; // Hauteur approximative de l'en-tête avec les contrôles
            
            return {
                "height": `calc(100% - ${headerHeight}px)`
            };
        },
        
        /**
         * Determines if dark theme is active
         * @returns {boolean} Is dark theme active
         */
        isDarkTheme() {
            return document.body.classList.contains("dark");
        },
        
        /**
         * Filtered groups based on search text
         * @returns {Array} Filtered groups
         */
        filteredGroups() {
            // Récupérer tous les groupes
            const allGroups = this.allGroups;
            
            // Si pas de recherche, retourner tous les groupes
            if (!this.searchText) {
                return allGroups;
            }
            
            // Filtrer les groupes selon le texte de recherche
            const searchLower = this.searchText.toLowerCase();
            return allGroups.filter(group => 
                group.name.toLowerCase().includes(searchLower)
            );
        },
        
        /**
         * All available groups including special groups
         * @returns {Array} All groups
         */
        allGroups() {
            // Groupes existants
            const regularGroups = Object.values(this.$root.monitorList || {}).filter(m => m.type === "group");
            const allMonitors = Object.values(this.$root.monitorList || {});
            
            // Vérifier s'il existe des moniteurs non assignés
            const unassignedMonitors = allMonitors.filter(m => 
                m.type !== "group" && 
                (!m.parent || !allMonitors.find(g => g.id === m.parent && g.type === "group"))
            );
            
            // Ajouter des groupes spéciaux au début
            const specialGroups = [
                { id: -1, name: this.$t('All Monitors'), type: 'special-group', isSpecial: true }
            ];
            
            // Ajouter le groupe Unassigned uniquement s'il contient des moniteurs
            if (unassignedMonitors.length > 0) {
                specialGroups.push({ id: -2, name: this.$t('Unassigned'), type: 'special-group', isSpecial: true });
            }
            
            return [
                ...specialGroups,
                ...regularGroups
            ];
        },
        
        /**
         * Groups to display
         * @returns {Array} Groups
         */
        groups() {
            return this.filteredGroups;
        },
        
        /**
         * Current selected group
         * @returns {Object|null} Current group
         */
        currentGroup() {
            if (this.groups.length === 0) return null;
            
            // Si l'index actuel est hors limites avec les groupes filtrés, revenir au premier groupe
            if (this.currentGroupIndex >= this.groups.length) {
                this.currentGroupIndex = 0;
            }
            
            return this.groups[this.currentGroupIndex];
        }
    },
    watch: {
        currentGroup(newVal) {
            this.$emit('group-selected', newVal ? newVal.id : null);
        }
    },
    mounted() {
        this.startTimer();
        // Émettre le groupe sélectionné au montage
        if (this.currentGroup) {
            this.$emit('group-selected', this.currentGroup.id);
        }
    },
    beforeUnmount() {
        this.stopTimer();
    },
    methods: {
        /**
         * Clear the search text
         * @returns {void}
         */
        clearSearchText() {
            this.searchText = "";
        },
        
        /**
         * Toggle pause/resume of auto-scrolling
         * @returns {void}
         */
        togglePause() {
            this.isPaused = !this.isPaused;
            if (this.isPaused) {
                this.stopTimer();
            } else {
                this.startTimer();
            }
        },
        
        /**
         * Start the auto-scroll timer
         * @returns {void}
         */
        startTimer() {
            this.stopTimer();
            this.startTime = Date.now();
            this.progressPercentage = 0;
            
            // Démarrer le timer principal pour changer de groupe
            this.timer = setInterval(() => {
                this.nextGroup();
            }, parseInt(this.interval));
            
            // Démarrer le timer de progression pour mettre à jour la barre
            this.startProgressTimer();
        },
        
        /**
         * Stop all timers
         * @returns {void}
         */
        stopTimer() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
            
            if (this.progressTimer) {
                clearInterval(this.progressTimer);
                this.progressTimer = null;
            }
        },
        
        /**
         * Start the progress bar timer
         * @returns {void}
         */
        startProgressTimer() {
            // Mettre à jour la barre de progression toutes les 50ms pour une animation fluide
            this.progressTimer = setInterval(() => {
                const elapsed = Date.now() - this.startTime;
                this.progressPercentage = Math.min(100, (elapsed / parseInt(this.interval)) * 100);
            }, 50);
        },
        
        /**
         * Move to the next group
         * @returns {void}
         */
        nextGroup() {
            if (this.groups.length === 0) return;
            this.currentGroupIndex = (this.currentGroupIndex + 1) % this.groups.length;
            
            // Réinitialiser le temps de départ et la barre de progression
            this.startTime = Date.now();
            this.progressPercentage = 0;
            
            // Émettre l'événement de sélection de groupe
            if (this.currentGroup) {
                this.$emit('group-selected', this.currentGroup.id);
            }
        },
        
        /**
         * Select a specific group by index
         * @param {number} index - Index of the group to select
         * @returns {void}
         */
        selectGroup(index) {
            this.currentGroupIndex = index;
            this.resetTimer();
            
            // Émettre l'événement de sélection de groupe
            if (this.currentGroup) {
                this.$emit('group-selected', this.currentGroup.id);
            }
        },
        
        /**
         * Reset the timer after a group change
         * @returns {void}
         */
        resetTimer() {
            if (!this.isPaused) {
                this.startTimer();
            }
        },
        
        getMonitorsCount(groupId) {
            const allMonitors = Object.values(this.$root.monitorList || {});
            
            // Si c'est le groupe "All Monitors"
            if (groupId === -1) {
                const count = allMonitors.filter(m => m.type !== "group").length;
                return count + ' ' + this.$t('Monitors');
            }
            
            // Si c'est le groupe "Unassigned"
            if (groupId === -2) {
                const count = allMonitors.filter(m => 
                    m.type !== "group" && 
                    (!m.parent || !allMonitors.find(g => g.id === m.parent && g.type === "group"))
                ).length;
                return count + ' ' + this.$t('Monitors');
            }
            
            // Pour les groupes normaux
            const count = allMonitors.filter(m => m.parent === groupId).length;
            return count + ' ' + this.$t('Monitors');
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.auto-scroll-sidebar {
    height: calc(100vh - 80px);
    position: relative;
    width: 100%;
    margin-top: 10px;
    background-color: white;
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    
    &:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
    }

    .dark & {
        background-color: $dark-bg;
        border-color: $dark-border-color;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        
        &:hover {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }
    }
    
    @media (max-width: 768px) {
        height: auto;
        min-height: 280px;
        max-height: 40vh;
    }
}

.list-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 10px 10px 0 0;
    margin: -10px;
    margin-bottom: 10px;
    padding: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.02);

    .dark & {
        background-color: $dark-header-bg;
        border-bottom: 0;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    
    .title {
        font-size: 1.1rem;
        font-weight: 600;
        color: $success;
    }
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    
    @media (max-width: 576px) {
        flex-direction: column;
        align-items: stretch;
        
        .search-wrapper {
            width: 100%;
            margin-top: 8px;
            max-width: none;
        }
        
        .title {
            text-align: center;
            margin-bottom: 5px;
        }
    }
}

.search-wrapper {
    display: flex;
    align-items: center;
    max-width: 190px;
    
    @media (max-width: 576px) {
        max-width: 100%;
        width: 100%;
        
        .form-control {
            width: 100%;
        }
    }
}

.search-icon {
    padding: 10px;
    color: #9ca3af;
    transition: all 0.2s ease;

    // Clear filter button (X)
    svg[data-icon="times"] {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            color: $success;
            transform: scale(1.1);
        }
    }
    
    svg[data-icon="search"] {
        color: #9ca3af;
    }
    
    .dark & {
        color: rgba(255, 255, 255, 0.6);
        
        svg[data-icon="search"] {
            color: rgba(255, 255, 255, 0.5);
        }
        
        svg[data-icon="times"]:hover {
            color: lighten($success, 10%);
        }
    }
}

.search-input {
    max-width: 15em;
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
    transition: all 0.25s ease;
    
    @media (max-width: 576px) {
        max-width: 100%;
    }
    
    &:focus {
        border-color: rgba($success, 0.3);
        box-shadow: 0 2px 8px rgba($success, 0.1);
    }
    
    .dark & {
        background-color: $dark-bg2;
        border-color: $dark-border-color;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        
        &:focus {
            border-color: rgba($success, 0.5);
            box-shadow: 0 2px 8px rgba($success, 0.2);
        }
    }
}

.controls {
    display: flex;
    align-items: center;
    padding: 10px 0;
    gap: 10px;
    margin-top: 10px;
    
    @media (max-width: 576px) {
        flex-wrap: wrap;
        justify-content: center;
        
        .interval-container {
            margin-left: 0;
            margin-top: 10px;
            width: 100%;
            justify-content: center;
        }
        
        .btn-outline-normal {
            flex: 1;
            justify-content: center;
        }
    }
    
    .btn-outline-normal {
        border-radius: 10px;
        padding: 6px 15px;
        font-weight: 500;
        font-size: 0.95rem;
        background: rgba(240, 240, 240, 0.5);
        border: 1px solid rgba(0, 0, 0, 0.05);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        
        &:hover {
            background-color: rgba($success, 0.1);
            color: $success;
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.05);
        }
        
        &:active {
            transform: scale(0.98);
        }
        
        .dark & {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            
            &:hover {
                background-color: rgba($success, 0.2);
                color: lighten($success, 15%);
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
            }
        }
    }
    
    .interval-container {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
        
        label {
            font-size: 0.9rem;
            margin-bottom: 0;
        }
    }
    
    .interval-select {
        background-color: #f5f5f5;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 10px;
        padding: 6px 10px;
        width: 80px;
        font-size: 0.9rem;
        
        &:focus {
            border-color: rgba($success, 0.3);
            box-shadow: 0 0 0 3px rgba($success, 0.1);
            outline: none;
        }
        
        .dark & {
            background-color: $dark-bg2;
            border-color: $dark-border-color;
            color: $dark-font-color;
            
            &:focus {
                border-color: rgba($success, 0.5);
                box-shadow: 0 0 0 3px rgba($success, 0.2);
            }
        }
    }
}

.groups-container {
    flex: 1;
    padding: 10px;
    overflow-y: auto;
    
    &.scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        
        &::-webkit-scrollbar {
            width: 6px;
        }
        
        &::-webkit-scrollbar-track {
            background: transparent;
        }
        
        &::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
        }
        
        .dark & {
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
            
            &::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.2);
            }
        }
    }
}

.group-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.group-item {
    padding: 12px 15px;
    background-color: #f8f9fa;
    border-radius: 10px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
    border-left: 2px solid transparent;
    
    .dark & {
        background-color: $dark-bg2;
    }
    
    &:hover {
        background-color: #f0f0f0;
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        
        .dark & {
            background-color: lighten($dark-bg2, 5%);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
    }
    
    &.active {
        border-left: 3px solid $success;
        padding-left: 14px;
        background-color: rgba($success, 0.05);
        
        .dark & {
            background-color: rgba($success, 0.1);
        }
        
        .group-name {
            font-weight: 600;
            color: $success;
        }
    }
    
    &.special-group {
        background-color: rgba(59, 130, 246, 0.05);
        border-left: 2px solid #3b82f6;
        
        .dark & {
            background-color: rgba(59, 130, 246, 0.1);
        }
        
        &.active {
            background-color: rgba(59, 130, 246, 0.1);
            border-left: 3px solid #3b82f6;
            
            .dark & {
                background-color: rgba(59, 130, 246, 0.15);
            }
            
            .group-name {
                color: #3b82f6;
            }
        }
    }
    
    .group-item-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }
    
    .group-icon {
        color: #666;
        
        .dark & {
            color: #aaa;
        }
    }
    
    .group-name {
        font-weight: 500;
        flex-grow: 1;
        margin-right: 10px;
        transition: all 0.2s ease;
    }
    
    .group-count {
        font-size: 0.75rem;
        background-color: #e9ecef;
        padding: 3px 8px;
        border-radius: 12px;
        min-width: 30px;
        text-align: center;
        
        .dark & {
            background-color: rgba(255, 255, 255, 0.1);
        }
    }
}

.no-groups {
    padding: 20px;
    text-align: center;
    color: #666;
    background-color: #f8f9fa;
    border-radius: 10px;
    margin: 10px 0;
    
    .dark & {
        background-color: $dark-bg2;
        color: #aaa;
    }
}

.progress-bar-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: rgba(0, 0, 0, 0.05);
    overflow: hidden;
    border-radius: 0 0 10px 10px;
    
    .dark & {
        background-color: rgba(255, 255, 255, 0.05);
    }
}

.progress-bar {
    height: 100%;
    background-color: $success;
    transition: width 0.1s linear;
    box-shadow: 0 0 5px rgba($success, 0.5);
    
    .special-group & {
        background-color: #3b82f6;
        box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
    }
}
</style>