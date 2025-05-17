<template>
    <div class="websocket-debug-page container-fluid">
        <div class="row">
            <div class="col-12">
                <h2 class="page-title">{{ $t('WebSocket Debug') }}</h2>
                <p class="page-description">
                    {{ $t('This page allows you to test and debug the WebSocket connectivity. You can send messages to the server and see the responses in real-time.') }}
                </p>
                
                <div class="alert alert-info">
                    <font-awesome-icon icon="info-circle" class="me-2" />
                    {{ $t('The WebSocket feature is used for real-time updates of monitor statuses without requiring page refreshes.') }}
                </div>
                
                <WebSocketDebug />
                
                <div class="example-section mt-4">
                    <h3>{{ $t('Example Messages') }}</h3>
                    <p>{{ $t('Here are some example messages you can send to test the WebSocket connection:') }}</p>
                    
                    <div class="example-cards">
                        <div class="example-card" @click="copyExample(requestStatusExample)">
                            <h5>{{ $t('Request Status Updates') }}</h5>
                            <pre>{{ requestStatusExample }}</pre>
                            <button class="btn btn-sm btn-primary">{{ $t('Copy') }}</button>
                        </div>
                        
                        <div class="example-card" @click="copyExample(monitorUpdateExample)">
                            <h5>{{ $t('Monitor Update') }}</h5>
                            <pre>{{ monitorUpdateExample }}</pre>
                            <button class="btn btn-sm btn-primary">{{ $t('Copy') }}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import WebSocketDebug from '../components/WebSocketDebug.vue';

export default {
    name: 'WebSocketDebugPage',
    
    components: {
        WebSocketDebug
    },
    
    data() {
        return {
            requestStatusExample: JSON.stringify({
                type: 'request_status',
                data: {
                    groupId: 1 // Remplacer par l'ID du groupe si nécessaire
                }
            }, null, 2),
            
            monitorUpdateExample: JSON.stringify({
                type: 'monitor_update',
                data: {
                    monitorId: 1, // Remplacer par l'ID du moniteur
                    status: 1,    // 0 = down, 1 = up, 2 = pending, 3 = maintenance
                    message: 'Monitor status update test',
                    groupId: 1    // Optionnel, pour cibler un groupe spécifique
                }
            }, null, 2)
        };
    },
    
    methods: {
        /**
         * Copie un exemple dans le presse-papier
         * @param {string} text - Le texte à copier
         */
        copyExample(text) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    this.$toast.success(this.$t('Example copied to clipboard'), {
                        timeout: 2000
                    });
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    this.$toast.error(this.$t('Failed to copy example'), {
                        timeout: 2000
                    });
                });
        }
    }
};
</script>

<style scoped>
.websocket-debug-page {
    padding: 20px 0;
}

.page-title {
    margin-bottom: 15px;
    font-weight: 600;
}

.page-description {
    margin-bottom: 25px;
    color: #6c757d;
}

.example-section {
    background-color: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
}

.example-section h3 {
    font-size: 1.4rem;
    margin-bottom: 15px;
}

.example-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-top: 15px;
}

.example-card {
    flex: 1;
    min-width: 300px;
    background-color: white;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 15px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.example-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.example-card h5 {
    margin-bottom: 10px;
    font-weight: 600;
}

.example-card pre {
    background-color: #f1f3f5;
    padding: 10px;
    border-radius: 4px;
    font-size: 0.85rem;
    margin-bottom: 10px;
    max-height: 150px;
    overflow-y: auto;
}

.example-card button {
    width: 100%;
}

@media (max-width: 768px) {
    .example-card {
        min-width: 100%;
    }
}
</style>