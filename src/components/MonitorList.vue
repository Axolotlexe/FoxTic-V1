<template>
    <div class="shadow-box mb-3" :style="boxStyle">
        <div class="list-header">
            <div class="header-top">
                <button class="btn btn-outline-normal ms-2 select-btn" :class="{ 'active': selectMode }" type="button" @click="selectMode = !selectMode">
                    <font-awesome-icon icon="check" class="me-1" />
                    <span class="btn-text">{{ $t("Select") }}</span>
                </button>
                
                <button class="btn btn-outline-normal ms-2 import-export-btn" type="button" @click="showGroupImportExport = true">
                    <font-awesome-icon icon="file" class="me-1" />
                    <span class="btn-text">{{ $t("Import/Export") }}</span>
                    <span class="btn-text-sm">{{ $t("Import/Export") }}</span>
                    <span class="btn-text-xs">{{ $t("I/E") }}</span>
                </button>

                <div class="flex-grow-1"></div>
                <div class="search-wrapper">
                    <form class="d-flex align-items-center">
                        <div class="position-relative flex-grow-1">
                            <input
                                v-model="searchText"
                                class="form-control search-input"
                                :placeholder="$t('Search...')"
                                :aria-label="$t('Search monitored sites')"
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
            <div class="header-filter">
                <MonitorListFilter :filterState="filterState" @update-filter="updateFilter" />
            </div>

            <!-- Selection Controls -->
            <div v-if="selectMode" class="selection-controls px-2 pt-2">
                <input
                    v-model="selectAll"
                    class="form-check-input select-input"
                    type="checkbox"
                />

                <button class="btn-outline-normal" @click="pauseDialog"><font-awesome-icon icon="pause" size="sm" /> {{ $t("Pause") }}</button>
                <button class="btn-outline-normal" @click="resumeSelected"><font-awesome-icon icon="play" size="sm" /> {{ $t("Resume") }}</button>

                <span v-if="selectedMonitorCount > 0">
                    {{ $t("selectedMonitorCount", [ selectedMonitorCount ]) }}
                </span>
            </div>
        </div>
        <div ref="monitorList" class="monitor-list" :class="{ scrollbar: scrollbar }" :style="monitorListStyle" data-testid="monitor-list">
            <div v-if="Object.keys($root.monitorList).length === 0" class="text-center mt-3">
                {{ $t("No Monitors, please") }} <router-link to="/add">{{ $t("add one") }}</router-link>
            </div>

            <MonitorListItem
                v-for="(item, index) in sortedMonitorList"
                :key="index"
                :monitor="item"
                :isSelectMode="selectMode"
                :isSelected="isSelected"
                :select="select"
                :deselect="deselect"
                :filter-func="filterFunc"
                :sort-func="sortFunc"
            />
        </div>
    </div>

    <Confirm ref="confirmPause" :yes-text="$t('Yes')" :no-text="$t('No')" @yes="pauseSelected">
        {{ $t("pauseMonitorMsg") }}
    </Confirm>
    
    <!-- Group Import/Export Modal -->
    <div v-if="showGroupImportExport" class="modal-wrapper">
        <GroupImportExport @close="showGroupImportExport = false" />
    </div>
</template>

<script>
import Confirm from "../components/Confirm.vue";
import MonitorListItem from "../components/MonitorListItem.vue";
import MonitorListFilter from "./MonitorListFilter.vue";
import GroupImportExport from "./GroupImportExport.vue";
import { getMonitorRelativeURL } from "../util.ts";

export default {
    components: {
        Confirm,
        MonitorListItem,
        MonitorListFilter,
        GroupImportExport,
    },
    props: {
        /** Should the scrollbar be shown */
        scrollbar: {
            type: Boolean,
        },
    },
    data() {
        return {
            searchText: "",
            selectMode: false,
            selectAll: false,
            disableSelectAllWatcher: false,
            selectedMonitors: {},
            showGroupImportExport: false,
            filterState: {
                status: null,
                active: null,
                tags: null,
            }
        };
    },
    computed: {
        /**
         * Fixed height for the monitor list box
         * @returns {object} Style for monitor list
         */
        boxStyle() {
            return {
                height: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "column"
            };
        },

        /**
         * Returns a sorted list of monitors based on the applied filters and search text.
         * @returns {Array} The sorted list of monitors.
         */
        sortedMonitorList() {
            let result = Object.values(this.$root.monitorList);

            result = result.filter(monitor => {
                // The root list does not show children
                if (monitor.parent !== null) {
                    return false;
                }
                return true;
            });

            result = result.filter(this.filterFunc);

            result.sort(this.sortFunc);

            return result;
        },

        isDarkTheme() {
            return document.body.classList.contains("dark");
        },

        monitorListStyle() {
            return {
                "flex": "1",
                "minHeight": "200px",
                "display": "flex",
                "flexDirection": "column"
            };
        },

        selectedMonitorCount() {
            return Object.keys(this.selectedMonitors).length;
        },

        /**
         * Determines if any filters are active.
         * @returns {boolean} True if any filter is active, false otherwise.
         */
        filtersActive() {
            return this.filterState.status != null || this.filterState.active != null || this.filterState.tags != null || this.searchText !== "";
        }
    },
    watch: {
        searchText() {
            for (let monitor of this.sortedMonitorList) {
                if (!this.selectedMonitors[monitor.id]) {
                    if (this.selectAll) {
                        this.disableSelectAllWatcher = true;
                        this.selectAll = false;
                    }
                    break;
                }
            }
        },
        selectAll() {
            if (!this.disableSelectAllWatcher) {
                this.selectedMonitors = {};

                if (this.selectAll) {
                    this.sortedMonitorList.forEach((item) => {
                        this.selectedMonitors[item.id] = true;
                    });
                }
            } else {
                this.disableSelectAllWatcher = false;
            }
        },
        selectMode() {
            if (!this.selectMode) {
                this.selectAll = false;
                this.selectedMonitors = {};
            }
        },
    },
    methods: {
        /**
         * Get URL of monitor
         * @param {number} id ID of monitor
         * @returns {string} Relative URL of monitor
         */
        monitorURL(id) {
            return getMonitorRelativeURL(id);
        },
        /**
         * Clear the search bar
         * @returns {void}
         */
        clearSearchText() {
            this.searchText = "";
        },
        /**
         * Update the MonitorList Filter
         * @param {object} newFilter Object with new filter
         * @returns {void}
         */
        updateFilter(newFilter) {
            this.filterState = newFilter;
        },
        /**
         * Deselect a monitor
         * @param {number} id ID of monitor
         * @returns {void}
         */
        deselect(id) {
            delete this.selectedMonitors[id];
        },
        /**
         * Select a monitor
         * @param {number} id ID of monitor
         * @returns {void}
         */
        select(id) {
            this.selectedMonitors[id] = true;
        },
        /**
         * Determine if monitor is selected
         * @param {number} id ID of monitor
         * @returns {bool} Is the monitor selected?
         */
        isSelected(id) {
            return id in this.selectedMonitors;
        },
        /**
         * Disable select mode and reset selection
         * @returns {void}
         */
        cancelSelectMode() {
            this.selectMode = false;
            this.selectedMonitors = {};
        },
        /**
         * Show dialog to confirm pause
         * @returns {void}
         */
        pauseDialog() {
            this.$refs.confirmPause.show();
        },
        /**
         * Pause each selected monitor
         * @returns {void}
         */
        pauseSelected() {
            Object.keys(this.selectedMonitors)
                .filter(id => this.$root.monitorList[id].active)
                .forEach(id => this.$root.getSocket().emit("pauseMonitor", id, () => {}));

            this.cancelSelectMode();
        },
        /**
         * Resume each selected monitor
         * @returns {void}
         */
        resumeSelected() {
            Object.keys(this.selectedMonitors)
                .filter(id => !this.$root.monitorList[id].active)
                .forEach(id => this.$root.getSocket().emit("resumeMonitor", id, () => {}));

            this.cancelSelectMode();
        },
        /**
         * Whether a monitor should be displayed based on the filters
         * @param {object} monitor Monitor to check
         * @returns {boolean} Should the monitor be displayed
         */
        filterFunc(monitor) {
            // Group monitors bypass filter if at least 1 of children matched
            if (monitor.type === "group") {
                const children = Object.values(this.$root.monitorList).filter(m => m.parent === monitor.id);
                if (children.some((child, index, children) => this.filterFunc(child))) {
                    return true;
                }
            }

            // filter by search text
            // finds monitor name, tag name or tag value
            let searchTextMatch = true;
            if (this.searchText !== "") {
                const loweredSearchText = this.searchText.toLowerCase();
                searchTextMatch =
                    monitor.name.toLowerCase().includes(loweredSearchText)
                    || monitor.tags.find(tag => tag.name.toLowerCase().includes(loweredSearchText)
                        || tag.value?.toLowerCase().includes(loweredSearchText));
            }

            // filter by status
            let statusMatch = true;
            if (this.filterState.status != null && this.filterState.status.length > 0) {
                if (monitor.id in this.$root.lastHeartbeatList && this.$root.lastHeartbeatList[monitor.id]) {
                    monitor.status = this.$root.lastHeartbeatList[monitor.id].status;
                }
                statusMatch = this.filterState.status.includes(monitor.status);
            }

            // filter by active
            let activeMatch = true;
            if (this.filterState.active != null && this.filterState.active.length > 0) {
                activeMatch = this.filterState.active.includes(monitor.active);
            }

            // filter by tags
            let tagsMatch = true;
            if (this.filterState.tags != null && this.filterState.tags.length > 0) {
                tagsMatch = monitor.tags.map(tag => tag.tag_id) // convert to array of tag IDs
                    .filter(monitorTagId => this.filterState.tags.includes(monitorTagId)) // perform Array Intersaction between filter and monitor's tags
                    .length > 0;
            }

            return searchTextMatch && statusMatch && activeMatch && tagsMatch;
        },
        /**
         * Function used in Array.sort to order monitors in a list.
         * @param {*} m1 monitor 1
         * @param {*} m2 monitor 2
         * @returns {number} -1, 0 or 1
         */
        sortFunc(m1, m2) {
            if (m1.active !== m2.active) {
                if (m1.active === false) {
                    return 1;
                }

                if (m2.active === false) {
                    return -1;
                }
            }

            if (m1.weight !== m2.weight) {
                if (m1.weight > m2.weight) {
                    return -1;
                }

                if (m1.weight < m2.weight) {
                    return 1;
                }
            }

            return m1.name.localeCompare(m2.name);
        }
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .dark & {
        background: rgba(0, 0, 0, 0.7);
    }
}

.shadow-box {
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
        max-height: 60vh;
    }
}

.small-padding {
    padding-left: 5px !important;
    padding-right: 5px !important;
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
}

.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    
    @media (max-width: 768px) {
        .import-export-btn {
            .btn-text {
                display: none;
            }
            .btn-text-sm {
                display: inline;
            }
            .btn-text-xs {
                display: none;
            }
            padding: 6px 12px;
        }
    }
    
    @media (max-width: 576px) {
        flex-wrap: wrap;
        justify-content: center;
        
        .search-wrapper {
            min-width: 100%;
            margin-top: 8px;
            order: 2;
        }
        
        .select-btn, .import-export-btn {
            margin-bottom: 5px;
        }
    }
    
    @media (max-width: 460px) {
        .import-export-btn {
            padding: 6px 8px;
            font-size: 0.9rem;
            
            .btn-text {
                display: none;
            }
            .btn-text-sm {
                display: none;
            }
            .btn-text-xs {
                display: inline;
            }
        }
    }
    
    .select-btn {
        white-space: nowrap;
        padding: 6px 16px;
        transition: all 0.2s ease;
        
        @media (max-width: 460px) {
            padding: 5px 10px;
            .btn-text {
                display: none;
            }
        }
    }

    .import-export-btn {
        .btn-text {
            display: inline;
        }
        .btn-text-sm, .btn-text-xs {
            display: none;
        }
        white-space: nowrap;
        max-width: none;
        padding: 6px 16px;
        transition: all 0.2s ease;
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
        
        &:hover {
            background-color: rgba($success, 0.1);
            color: $success;
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.05);
        }
        
        &:active {
            transform: scale(0.98);
        }
        
        &.active {
            background-color: rgba($success, 0.15);
            color: darken($success, 5%);
            font-weight: 600;
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
            
            &.active {
                background-color: rgba($success, 0.25);
                color: lighten($success, 20%);
            }
        }
    }
}

.header-filter {
    display: flex;
    align-items: center;
}

@media (max-width: 770px) {
    .list-header {
        margin: -20px;
        margin-bottom: 10px;
        padding: 5px;
    }
}

.monitor-list {
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    flex-grow: 1;
    min-height: 200px;
    display: flex;
    flex-direction: column;
}

.search-wrapper {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    min-width: 180px;
    margin-left: 10px;
    
    @media (max-width: 768px) {
        min-width: 150px;
        margin-left: 6px;
    }
    
    @media (max-width: 576px) {
        width: 100%;
        min-width: 100%;
        margin-left: 0;
        margin-top: 8px;
        
        .form-control {
            width: 100%;
            font-size: 0.9rem;
            height: 36px;
        }
    }
    
    @media (max-width: 460px) {
        .form-control {
            height: 34px;
            font-size: 0.85rem;
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

.monitor-item {
    width: 100%;
}

.tags {
    margin-top: 4px;
    padding-left: 67px;
    display: flex;
    flex-wrap: wrap;
    gap: 0;
}

.bottom-style {
    padding-left: 67px;
    margin-top: 5px;
}

.selection-controls {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 8px;
    
    @media (max-width: 576px) {
        flex-wrap: wrap;
        
        .btn-outline-normal {
            flex: 1;
            justify-content: center;
            margin-bottom: 5px;
        }
    }
    
    .dark & {
        background-color: rgba(255, 255, 255, 0.05);
    }
    
    .btn-outline-normal {
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 0.9rem;
        
        &:hover {
            background-color: rgba($success, 0.1);
            color: $success;
            transform: translateY(-1px);
        }
        
        &:active {
            transform: scale(0.98);
        }
        
        .dark & {
            &:hover {
                background-color: rgba($success, 0.2);
                color: lighten($success, 15%);
            }
        }
    }
    
    .form-check-input {
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:checked {
            background-color: $success;
            border-color: $success;
        }
        
        &:focus {
            box-shadow: 0 0 0 0.25rem rgba($success, 0.25);
        }
    }
}
</style>
