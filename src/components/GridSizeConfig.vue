<template>
    <div class="grid-config-container">
        <div class="config-section">
            <div class="section-title">{{ $t('Card Size Configuration') }}</div>
            
            <div class="config-item">
                <label>{{ $t('Cards per row') }}: {{ cardsPerRow }}</label>
                <div class="range-container">
                    <input 
                        type="range" 
                        class="form-range" 
                        min="1" 
                        max="6" 
                        step="1" 
                        v-model.number="cardsPerRow"
                        @input="updateGridSize" 
                    />
                    <div class="value-indicators">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                    </div>
                </div>
            </div>
            
            <div class="config-item">
                <label>{{ $t('Card size') }}: {{ cardSizeValue }}px</label>
                <div class="range-container">
                    <input 
                        type="range" 
                        class="form-range" 
                        :min="minCardSize" 
                        :max="maxCardSize" 
                        step="10" 
                        v-model.number="cardSizeValue"
                        @input="updateGridSize" 
                    />
                    <div class="value-indicators">
                        <span>{{ minCardSize }}</span>
                        <span>{{ Math.floor((minCardSize + maxCardSize) / 2) }}</span>
                        <span>{{ maxCardSize }}</span>
                    </div>
                </div>
            </div>

            <div class="config-item">
                <label>{{ $t('Card gap') }}: {{ cardGap }}px</label>
                <div class="range-container">
                    <input 
                        type="range" 
                        class="form-range" 
                        min="5" 
                        max="30" 
                        step="1" 
                        v-model.number="cardGap"
                        @input="updateGridSize" 
                    />
                    <div class="value-indicators">
                        <span>5</span>
                        <span>15</span>
                        <span>30</span>
                    </div>
                </div>
            </div>
            
            <div class="config-actions">
                <button class="btn btn-sm btn-outline-primary" @click="resetToDefaults">
                    {{ $t('Reset to defaults') }}
                </button>
            </div>
        </div>

        <div class="preview-section">
            <div class="section-title">{{ $t('Preview') }}</div>
            <div class="grid-preview" :style="previewStyle">
                <div v-for="i in 6" :key="i" class="preview-card"></div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        viewType: {
            type: String,
            required: true,
            validator: value => ['dashboard', 'autoscroll'].includes(value)
        }
    },
    data() {
        return {
            minCardSize: 200,
            maxCardSize: 400,
            cardSizeValue: 300,
            cardsPerRow: 3,
            cardGap: 15,
            defaultValues: {
                dashboard: {
                    cardSize: 300,
                    cardsPerRow: 3,
                    cardGap: 15
                },
                autoscroll: {
                    cardSize: 300, // Uniformisé avec dashboard
                    cardsPerRow: 3,
                    cardGap: 15
                }
            }
        };
    },
    computed: {
        previewStyle() {
            const columnWidth = `${this.cardSizeValue}px`;
            
            return {
                display: 'grid',
                gridTemplateColumns: `repeat(${this.cardsPerRow}, ${columnWidth})`,
                gap: `${this.cardGap}px`,
                width: `calc(${this.cardsPerRow} * ${columnWidth} + ${this.cardsPerRow - 1} * ${this.cardGap}px)`
            };
        },
        configKey() {
            return this.viewType === 'dashboard' ? 'dashboardGridConfig' : 'autoscrollGridConfig';
        }
    },
    created() {
        // Charger les configurations enregistrées si elles existent
        const savedConfig = localStorage.getItem(this.configKey);
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.cardSizeValue = config.cardSize || this.defaultValues[this.viewType].cardSize;
            this.cardsPerRow = config.cardsPerRow || this.defaultValues[this.viewType].cardsPerRow;
            this.cardGap = config.cardGap || this.defaultValues[this.viewType].cardGap;
        } else {
            // Utiliser les valeurs par défaut pour ce type de vue
            this.cardSizeValue = this.defaultValues[this.viewType].cardSize;
            this.cardsPerRow = this.defaultValues[this.viewType].cardsPerRow;
            this.cardGap = this.defaultValues[this.viewType].cardGap;
        }
    },
    methods: {
        updateGridSize() {
            // Sauvegarder la configuration dans le localStorage
            const config = {
                cardSize: this.cardSizeValue,
                cardsPerRow: this.cardsPerRow,
                cardGap: this.cardGap
            };
            
            localStorage.setItem(this.configKey, JSON.stringify(config));
            
            // Émettre un événement avec la nouvelle configuration
            this.$emit('grid-updated', config);
        },
        resetToDefaults() {
            this.cardSizeValue = this.defaultValues[this.viewType].cardSize;
            this.cardsPerRow = this.defaultValues[this.viewType].cardsPerRow;
            this.cardGap = this.defaultValues[this.viewType].cardGap;
            this.updateGridSize();
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.grid-config-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    .dark & {
        background: #2a2a2a;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
}

.section-title {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 12px;
    color: #444;
    
    .dark & {
        color: #ddd;
    }
}

.config-section, .preview-section {
    padding: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    
    .dark & {
        background: #333;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
}

.config-item {
    margin-bottom: 15px;
    
    label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.9rem;
        color: #555;
        
        .dark & {
            color: #bbb;
        }
    }
}

.range-container {
    position: relative;
    padding-bottom: 15px;
    
    .form-range {
        width: 100%;
        cursor: pointer;
        
        &::-webkit-slider-thumb {
            background-color: $primary;
        }
        
        &::-moz-range-thumb {
            background-color: $primary;
        }
    }
    
    .value-indicators {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        padding: 0 2px;
        font-size: 0.75rem;
        color: #777;
        
        .dark & {
            color: #999;
        }
    }
}

.config-actions {
    margin-top: 20px;
    text-align: right;
}

.grid-preview {
    background: #f0f0f0;
    border-radius: 6px;
    padding: 15px;
    overflow: auto;
    margin: 0 auto;
    max-width: 100%;
    
    .dark & {
        background: #222;
    }
    
    .preview-card {
        height: 100px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
        
        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        
        .dark & {
            background: #3a3a3a;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
            
            &:hover {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
        }
    }
}

@media (min-width: 768px) {
    .grid-config-container {
        flex-direction: row;
    }
    
    .config-section, .preview-section {
        flex: 1;
    }
}

@media (max-width: 767px) {
    .grid-preview {
        overflow-x: auto;
    }
}
</style>