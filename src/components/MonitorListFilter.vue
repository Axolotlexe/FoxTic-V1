<template>
    <div class="px-2 pt-2 d-flex filter-container">
        <!-- Bouton d'ajout de moniteur -->
        <router-link to="/add" class="btn btn-success add-monitor-btn me-2">
            <font-awesome-icon icon="plus" class="fa-icon me-1" />
            <span class="btn-text">{{ $t("Add") }}</span>
        </router-link>
        
        <button
            type="button"
            :title="$t('Clear current filters')"
            class="clear-filters-btn btn"
            :class="{ 'active': numFiltersActive > 0}"
            tabindex="0"
            :disabled="numFiltersActive === 0"
            @click="clearFilters"
        >
            <font-awesome-icon icon="stream" />
            <span v-if="numFiltersActive > 0" class="px-1 fw-bold">{{ numFiltersActive }}</span>
            <font-awesome-icon v-if="numFiltersActive > 0" icon="times" />
        </button>
        <MonitorListFilterDropdown
            :filterActive="filterState.status?.length > 0"
        >
            <template #status>
                <Status v-if="filterState.status?.length === 1" :status="filterState.status[0]" />
                <span v-else>
                    {{ $t('Status') }}
                </span>
            </template>
            <template #dropdown>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleStatusFilter(1)">
                        <div class="d-flex align-items-center justify-content-between">
                            <Status :status="1" />
                            <span class="ps-3">
                                {{ $root.stats.up }}
                                <span v-if="filterState.status?.includes(1)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleStatusFilter(0)">
                        <div class="d-flex align-items-center justify-content-between">
                            <Status :status="0" />
                            <span class="ps-3">
                                {{ $root.stats.down }}
                                <span v-if="filterState.status?.includes(0)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleStatusFilter(2)">
                        <div class="d-flex align-items-center justify-content-between">
                            <Status :status="2" />
                            <span class="ps-3">
                                {{ $root.stats.pending }}
                                <span v-if="filterState.status?.includes(2)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleStatusFilter(3)">
                        <div class="d-flex align-items-center justify-content-between">
                            <Status :status="3" />
                            <span class="ps-3">
                                {{ $root.stats.maintenance }}
                                <span v-if="filterState.status?.includes(3)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
            </template>
        </MonitorListFilterDropdown>
        <MonitorListFilterDropdown :filterActive="filterState.active?.length > 0">
            <template #status>
                <span v-if="filterState.active?.length === 1">
                    <span v-if="filterState.active[0]">{{ $t("Running") }}</span>
                    <span v-else>{{ $t("filterActivePaused") }}</span>
                </span>
                <span v-else>
                    {{ $t("filterActive") }}
                </span>
            </template>
            <template #dropdown>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleActiveFilter(true)">
                        <div class="d-flex align-items-center justify-content-between">
                            <span>{{ $t("Running") }}</span>
                            <span class="ps-3">
                                {{ $root.stats.active }}
                                <span v-if="filterState.active?.includes(true)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleActiveFilter(false)">
                        <div class="d-flex align-items-center justify-content-between">
                            <span>{{ $t("filterActivePaused") }}</span>
                            <span class="ps-3">
                                {{ $root.stats.pause }}
                                <span v-if="filterState.active?.includes(false)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
            </template>
        </MonitorListFilterDropdown>
        <MonitorListFilterDropdown :filterActive="filterState.tags?.length > 0">
            <template #status>
                <Tag
                    v-if="filterState.tags?.length === 1"
                    :item="tagsList.find(tag => tag.id === filterState.tags[0])"
                    :size="'sm'"
                />
                <span v-else>
                    {{ $t('Tags') }}
                </span>
            </template>
            <template #dropdown>
                <li v-for="tag in tagsList" :key="tag.id">
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleTagFilter(tag)">
                        <div class="d-flex align-items-center justify-content-between">
                            <span><Tag :item="tag" :size="'sm'" /></span>
                            <span class="ps-3">
                                {{ getTaggedMonitorCount(tag) }}
                                <span v-if="filterState.tags?.includes(tag.id)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li v-if="tagsList.length === 0">
                    <div class="dropdown-item disabled px-3">
                        {{ $t('No tags found.') }}
                    </div>
                </li>
            </template>
        </MonitorListFilterDropdown>
    </div>
</template>

<script>
import MonitorListFilterDropdown from "./MonitorListFilterDropdown.vue";
import Status from "./Status.vue";
import Tag from "./Tag.vue";

export default {
    components: {
        MonitorListFilterDropdown,
        Status,
        Tag,
    },
    props: {
        filterState: {
            type: Object,
            required: true,
        }
    },
    emits: [ "updateFilter" ],
    data() {
        return {
            tagsList: [],
        };
    },
    computed: {
        numFiltersActive() {
            let num = 0;

            Object.values(this.filterState).forEach(item => {
                if (item != null && item.length > 0) {
                    num += 1;
                }
            });

            return num;
        }
    },
    mounted() {
        this.getExistingTags();
    },
    methods: {
        toggleStatusFilter(status) {
            let newFilter = {
                ...this.filterState
            };

            if (newFilter.status == null) {
                newFilter.status = [ status ];
            } else {
                if (newFilter.status.includes(status)) {
                    newFilter.status = newFilter.status.filter(item => item !== status);
                } else {
                    newFilter.status.push(status);
                }
            }
            this.$emit("updateFilter", newFilter);
        },
        toggleActiveFilter(active) {
            let newFilter = {
                ...this.filterState
            };

            if (newFilter.active == null) {
                newFilter.active = [ active ];
            } else {
                if (newFilter.active.includes(active)) {
                    newFilter.active = newFilter.active.filter(item => item !== active);
                } else {
                    newFilter.active.push(active);
                }
            }
            this.$emit("updateFilter", newFilter);
        },
        toggleTagFilter(tag) {
            let newFilter = {
                ...this.filterState
            };

            if (newFilter.tags == null) {
                newFilter.tags = [ tag.id ];
            } else {
                if (newFilter.tags.includes(tag.id)) {
                    newFilter.tags = newFilter.tags.filter(item => item !== tag.id);
                } else {
                    newFilter.tags.push(tag.id);
                }
            }
            this.$emit("updateFilter", newFilter);
        },
        clearFilters() {
            this.$emit("updateFilter", {
                status: null,
            });
        },
        getExistingTags() {
            this.$root.getSocket().emit("getTags", (res) => {
                if (res.ok) {
                    this.tagsList = res.tags;
                }
            });
        },
        getTaggedMonitorCount(tag) {
            return Object.values(this.$root.monitorList).filter(monitor => {
                return monitor.tags.find(monitorTag => monitorTag.tag_id === tag.id);
            }).length;
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.dropdown-item {
    cursor: pointer;
}

.filter-container {
    flex-wrap: wrap;
    gap: 5px;
    
    @media (max-width: 768px) {
        gap: 4px;
    }
    
    @media (max-width: 576px) {
        gap: 3px;
        justify-content: center;
    }
    
    @media (max-width: 460px) {
        gap: 2px;
    }
}

.add-monitor-btn {
    font-size: 0.85em;
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 10px;
    font-weight: 500;
    transition: all 0.2s ease;
    box-shadow: 0 2px 5px rgba(40, 167, 69, 0.2);
    
    @media (max-width: 768px) {
        padding: 6px 10px;
        font-size: 0.8em;
    }
    
    @media (max-width: 576px) {
        padding: 5px 10px;
        font-size: 0.8em;
    }
    
    @media (max-width: 460px) {
        padding: 5px 8px;
        font-size: 0.75em;
        min-width: 70px;
        justify-content: center;
    }
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(40, 167, 69, 0.25);
    }
    
    .dark & {
        color: #fff;
    }
    
    .btn-text {
        @media (max-width: 460px) {
            display: none;
        }
    }
    
    .fa-icon {
        @media (max-width: 460px) {
            margin-right: 0;
        }
    }
}

.clear-filters-btn {
    font-size: 0.85em;
    margin-right: 5px;
    display: flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 10px;
    background-color: #f8f9fa;
    border: 1px solid #e0e0e0;
    color: #666;
    transition: all 0.2s ease;
    
    @media (max-width: 768px) {
        padding: 6px 10px;
        font-size: 0.8em;
        margin-right: 4px;
    }
    
    @media (max-width: 576px) {
        padding: 5px 10px;
        font-size: 0.8em;
        margin-right: 3px;
    }
    
    @media (max-width: 460px) {
        padding: 5px 8px;
        font-size: 0.75em;
        margin-right: 2px;
    }
    
    &:hover:not(:disabled) {
        background-color: #f0f0f0;
        border-color: #d0d0d0;
    }
    
    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .dark & {
        color: $dark-font-color;
        border: 1px solid $dark-font-color2;
        background-color: transparent;
    }

    &.active {
        border: 1px solid rgba($success, 0.5);
        background-color: rgba($success, 0.08);
        color: $success;

        .dark & {
            background-color: $dark-font-color2;
        }
    }
}
</style>
