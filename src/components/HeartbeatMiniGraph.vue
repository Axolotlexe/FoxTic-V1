<template>
    <div class="mini-graph" ref="graphContainer">
        <div 
            v-for="(dot, index) in dots" 
            :key="index" 
            class="dot" 
            :class="getStatusClass(dot)"
            :style="dotStyle(index)"
        ></div>
    </div>
</template>

<script>
export default {
    props: {
        heartbeats: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            maxDots: 12
        };
    },
    computed: {
        dots() {
            // Limiter le nombre de heartbeats utilisés
            return this.heartbeats.slice(0, this.maxDots);
        }
    },
    methods: {
        getStatusClass(heartbeat) {
            if (!heartbeat) return 'dot-unknown';
            
            switch (heartbeat.status) {
                case 0:
                    return 'dot-down';
                case 1:
                    return 'dot-up';
                case 2:
                    return 'dot-pending';
                default:
                    return 'dot-unknown';
            }
        },
        
        dotStyle(index) {
            // Position des dots à égale distance
            return {
                left: `${(index / (this.maxDots - 1)) * 100}%`
            };
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.mini-graph {
    position: relative;
    width: 100%;
    height: 20px;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
    overflow: hidden;
    
    .dark & {
        background-color: rgba(255, 255, 255, 0.05);
    }
}

.dot {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    top: 50%;
    transform: translateY(-50%);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    
    &.dot-up {
        background-color: $success;
    }
    
    &.dot-down {
        background-color: $danger;
    }
    
    &.dot-pending {
        background-color: $warning;
    }
    
    &.dot-unknown {
        background-color: #aaa;
    }
}
</style>