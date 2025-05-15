<template>
    <div class="simple-chart-wrapper">
        <!-- Ligne de base continue -->
        <div class="chart-baseline"></div>
        
        <!-- Points pour chaque donnée -->
        <div
            v-for="(point, index) in datapoints"
            :key="index"
            class="simple-chart-point"
            :style="{
                backgroundColor: getColorForStatus(point.status),
                left: `${(index * (100 / Math.max(1, datapoints.length - 1)))}%`
            }"
            :title="getTooltipText(point)"
        ></div>
    </div>
</template>

<script>
export default {
    props: {
        /** ID of monitor */
        monitorId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            datapoints: [],
        };
    },
    mounted() {
        this.fetchData();
    },
    watch: {
        // Actualiser quand les données heartbeat changent
        '$root.heartbeatList': {
            handler() {
                this.fetchData();
            },
            deep: true
        }
    },
    methods: {
        fetchData() {
            try {
                // Récupérer les données du heartbeat pour ce moniteur
                let heartbeatList = (this.monitorId in this.$root.heartbeatList && this.$root.heartbeatList[this.monitorId]) || [];
                
                // Limiter le nombre de points pour ne pas surcharger le graphique
                const limitedHeartbeatList = heartbeatList.slice(0, 15);
                
                // Trier par date pour s'assurer que les points sont bien ordonnés (du plus récent au plus ancien)
                limitedHeartbeatList.sort((a, b) => {
                    return new Date(b.time) - new Date(a.time);
                });
                
                this.datapoints = limitedHeartbeatList.map(beat => ({
                    time: beat.time,
                    status: beat.status,
                    msg: beat.msg || ''  // Message associé à l'événement
                }));
            } catch (error) {
                console.error("Erreur lors de la récupération des données:", error);
                this.datapoints = [];
            }
        },
        getColorForStatus(status) {
            // Pour s'assurer que le statut est traité comme un nombre entier
            const statusNum = parseInt(status);
            
            // Status: 0 = DOWN, 1 = UP, 2 = PENDING, 3 = MAINTENANCE
            switch (statusNum) {
                case 0: // DOWN
                    return 'rgba(220, 53, 69, 0.8)'; // Rouge
                case 2: // PENDING
                    return 'rgba(245, 182, 23, 0.8)'; // Jaune
                case 3: // MAINTENANCE
                    return 'rgba(23, 71, 245, 0.8)'; // Bleu
                case 1: // UP
                    return 'rgba(92, 221, 139, 0.8)'; // Vert
                default: 
                    return 'rgba(92, 221, 139, 0.8)'; // Vert par défaut
            }
        },
        
        formatTime(timestamp) {
            if (!timestamp) return '';
            
            // Utiliser la fonction de formatage de date de l'application
            if (this.$root && this.$root.formatDateTime) {
                return this.$root.formatDateTime(timestamp);
            }
            
            // Fallback au cas où la fonction n'est pas disponible
            try {
                const date = new Date(timestamp);
                return date.toLocaleString();
            } catch (e) {
                return timestamp;
            }
        },
        
        getStatusText(statusCode) {
            // Status: 0 = DOWN, 1 = UP, 2 = PENDING, 3 = MAINTENANCE
            const statusNum = parseInt(statusCode);
            switch (statusNum) {
                case 0: 
                    return 'DOWN';
                case 2:
                    return 'PENDING';
                case 3:
                    return 'MAINTENANCE';
                default:
                    return 'UP';
            }
        },
        
        getTooltipText(point) {
            if (!point) return '';
            
            const status = this.getStatusText(point.status);
            const time = this.formatTime(point.time);
            let tooltip = `Status: ${status}\nTime: ${time}`;
            
            if (point.msg && point.msg.trim() !== '') {
                tooltip += `\nMessage: ${point.msg}`;
            }
            
            return tooltip;
        }
    }
};
</script>

<style lang="scss" scoped>
.simple-chart-wrapper {
    position: relative;
    height: 20px;  /* Augmenté pour plus de visibilité */
    width: 100%;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
    overflow: visible; /* Permet aux points de dépasser */
    margin: 10px 0;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-baseline {
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: rgba(0, 0, 0, 0.1);
    transform: translateY(-50%);
}

.simple-chart-point {
    position: absolute;
    height: 16px;
    width: 6px;
    border-radius: 10px;
    top: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    z-index: 2;
    
    &:hover {
        height: 20px;
        width: 8px;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
        z-index: 3;
    }
}
</style>