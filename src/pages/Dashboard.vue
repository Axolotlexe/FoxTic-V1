<template>
    <div class="container-fluid">
        <div class="row position-relative">
            <div class="sidebar-container" :style="sidebarStyle">
                <!-- Toggle entre le mode normal et le mode défilement automatique -->
                <div class="view-toggle">
                    <button 
                        class="btn btn-sm" 
                        :class="{ 'btn-active': !autoScrollEnabled }"
                        @click="autoScrollEnabled = false"
                    >
                        <font-awesome-icon icon="list" /> <span>{{ $t('Normal View') }}</span>
                    </button>
                    <button 
                        class="btn btn-sm" 
                        :class="{ 'btn-active': autoScrollEnabled }"
                        @click="autoScrollEnabled = true"
                    >
                        <font-awesome-icon icon="play-circle" /> <span>{{ $t('Auto Scroll') }}</span>
                    </button>
                </div>
                
                <!-- Liste des moniteurs ou groupes selon le mode -->
                <MonitorList v-if="!autoScrollEnabled" :scrollbar="true" />
                <AutoScrollMonitorList 
                    v-else 
                    @group-selected="onGroupSelected"
                />
                
                <!-- Barre de redimensionnement -->
                <div 
                    ref="resizer" 
                    class="resizer"
                    @mousedown="startResize"
                    @touchstart="startResize"
                    :title="$t('Drag to resize')"
                ></div>
            </div>

            <div ref="container" class="content-container" :style="contentStyle">
                <!-- Vue normale: afficher le contenu régulier -->
                <router-view v-if="!autoScrollEnabled" :key="$route.fullPath" :calculatedHeight="height" />
                
                <!-- Vue défilement auto: afficher les moniteurs du groupe sélectionné -->
                <MonitorListTable v-else :groupId="selectedGroupId" />
            </div>
        </div>
    </div>
</template>

<script>
import MonitorList from "../components/MonitorList.vue";
import AutoScrollMonitorList from "../components/AutoScrollMonitorList.vue";
import MonitorListTable from "../components/MonitorListTable.vue";

export default {
    components: {
        MonitorList,
        AutoScrollMonitorList,
        MonitorListTable
    },
    data() {
        return {
            height: 0,
            sidebarWidth: 320,
            minSidebarWidth: 250,
            maxSidebarWidth: 500,
            isResizing: false,
            autoScrollEnabled: false,
            selectedGroupId: null
        };
    },
    computed: {
        sidebarStyle() {
            return {
                width: `${this.sidebarWidth}px`
            };
        },
        contentStyle() {
            if (this.$root.isMobile) {
                return {
                    width: '100%'
                };
            }
            return {
                width: `calc(100% - ${this.sidebarWidth + 15}px)`,
                marginLeft: `${this.sidebarWidth + 15}px`
            };
        }
    },
    watch: {
        autoScrollEnabled(newValue) {
            localStorage.setItem('autoScrollEnabled', newValue);
        }
    },
    mounted() {
        this.height = this.$refs.container.offsetHeight;
        
        // Récupérer la préférence utilisateur
        const savedPref = localStorage.getItem('autoScrollEnabled');
        if (savedPref !== null) {
            this.autoScrollEnabled = savedPref === 'true';
        }
        
        // Ajouter les événements globaux pour le redimensionnement
        document.addEventListener('mousemove', this.resize);
        document.addEventListener('mouseup', this.stopResize);
        document.addEventListener('touchmove', this.resize);
        document.addEventListener('touchend', this.stopResize);
        
        window.addEventListener('blur', this.stopResize);
    },
    beforeUnmount() {
        // Supprimer les événements globaux
        document.removeEventListener('mousemove', this.resize);
        document.removeEventListener('mouseup', this.stopResize);
        document.removeEventListener('touchmove', this.resize);
        document.removeEventListener('touchend', this.stopResize);
        window.removeEventListener('blur', this.stopResize);
    },
    methods: {
        startResize(e) {
            this.isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        },
        
        resize(e) {
            if (!this.isResizing) return;
            
            let clientX;
            
            // Support tactile et souris
            if (e.type === 'touchmove') {
                clientX = e.touches[0].clientX;
            } else {
                clientX = e.clientX;
            }
            
            // Limiter la largeur entre min et max
            let newWidth = clientX;
            if (newWidth < this.minSidebarWidth) newWidth = this.minSidebarWidth;
            if (newWidth > this.maxSidebarWidth) newWidth = this.maxSidebarWidth;
            
            this.sidebarWidth = newWidth;
            
            // Sauvegarder dans localStorage
            localStorage.setItem('sidebarWidth', newWidth);
        },
        
        stopResize() {
            this.isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        },
        
        // Méthode pour gérer la sélection d'un groupe
        onGroupSelected(groupId) {
            this.selectedGroupId = groupId;
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.container-fluid {
    width: 98%;
}

.sidebar-container {
    position: fixed;
    height: calc(100vh - 100px);
    top: 100px;
    left: 0;
    padding: 0 15px;
    transition: width 0.05s ease;
    z-index: 10;
    overflow: hidden;
}

.content-container {
    margin-top: 30px;
    transition: width 0.05s ease, margin-left 0.05s ease;
    padding-left: 15px;
    padding-right: 15px;
}

.resizer {
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 100%;
    background-color: transparent;
    cursor: col-resize;
    z-index: 20;
    transition: background-color 0.2s ease;
    
    &::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        height: 40px;
        width: 4px;
        background-color: rgba(200, 200, 200, 0.3);
        border-radius: 10px;
    }
    
    &:hover, &:active {
        background-color: rgba(0, 123, 255, 0.1);
        
        &::after {
            background-color: $success;
        }
    }
}

.view-toggle {
    display: flex;
    background-color: #f0f0f0;
    border-radius: 10px;
    padding: 3px;
    
    .dark & {
        background-color: $dark-bg;
    }
    
    .btn {
        padding: 8px 15px;
        border: none;
        background: transparent;
        color: #666;
        border-radius: 8px;
        font-size: 16px;
        transition: all 0.2s ease;
        outline: none !important;
        box-shadow: none !important;
        
        &:focus {
            outline: none !important;
            box-shadow: none !important;
        }
        margin: 0 2px;
        
        &:hover {
            color: $success;
        }
        
        &.btn-active {
            background-color: white;
            color: $success;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            
            .dark & {
                background-color: $dark-header-bg;
                color: $success;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            }
        }
        
        .dark & {
            color: $dark-font-color;
        }
    }
}

@media (max-width: 768px) {
    .sidebar-container {
        position: relative;
        width: 100% !important;
        height: auto;
        top: 0;
        margin-top: 65px;
        padding: 0 10px;
    }
    
    .content-container {
        width: 100% !important;
        margin-left: 0 !important;
        margin-top: 10px;
        padding: 0 10px;
    }
    
    .resizer {
        display: none;
    }
    
    .view-toggle {
        margin-bottom: 10px;
        
        .btn {
            padding: 8px 6px;
            font-size: 0.85rem;
            
            /* Sur très petits écrans, cacher le texte et ne montrer que l'icône */
            @media (max-width: 480px) {
                padding: 8px 4px;
                
                span {
                    display: none;
                }
                
                svg {
                    margin: 0 auto;
                    font-size: 1.1rem;
                }
            }
        }
    }
}

/* Ajout d'une media query pour les très petits écrans */
@media (max-width: 350px) {
    .sidebar-container {
        padding: 0 5px;
    }
    
    .content-container {
        padding: 0 5px;
    }
}
</style>
