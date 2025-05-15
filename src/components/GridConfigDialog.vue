<template>
    <transition name="fade">
        <div class="grid-config-dialog-backdrop" v-if="show" @click.self="closeDialog">
            <div class="grid-config-dialog">
                <div class="dialog-header">
                    <h5 class="dialog-title">{{ $t('Configure Grid Layout') }}</h5>
                    <button type="button" class="btn-close" @click="closeDialog" aria-label="Close"></button>
                </div>
                <div class="dialog-body">
                    <GridSizeConfig :viewType="viewType" @grid-updated="onGridUpdated" />
                </div>
                <div class="dialog-footer">
                    <button type="button" class="btn btn-secondary" @click="closeDialog">
                        {{ $t('Close') }}
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
import GridSizeConfig from './GridSizeConfig.vue';

export default {
    components: {
        GridSizeConfig
    },
    props: {
        show: {
            type: Boolean,
            required: true
        },
        viewType: {
            type: String,
            required: true,
            validator: value => ['dashboard', 'autoscroll'].includes(value)
        }
    },
    methods: {
        closeDialog() {
            this.$emit('close');
        },
        onGridUpdated(config) {
            this.$emit('grid-updated', config);
        }
    }
};
</script>

<style lang="scss" scoped>
.grid-config-dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s;
}

.grid-config-dialog {
    width: 90%;
    max-width: 800px;
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    
    .dark & {
        background-color: #2a2a2a;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
    }
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #e0e0e0;
    
    .dark & {
        border-bottom-color: #444;
    }
    
    .dialog-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #333;
        
        .dark & {
            color: #eee;
        }
    }
    
    .btn-close {
        background-color: transparent;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        color: #777;
        
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

.dialog-body {
    padding: 20px;
    max-height: 70vh;
    overflow-y: auto;
}

.dialog-footer {
    padding: 16px 20px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
    
    .dark & {
        border-top-color: #444;
    }
    
    button {
        margin-left: 10px;
    }
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
    opacity: 0;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>