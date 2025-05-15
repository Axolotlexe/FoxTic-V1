<template>
    <div class="websocket-status">
        <div class="status-indicator">
            <div :class="['status-dot', connectionStatusClass]"></div>
            <span>{{ connectionStatusText }}</span>
        </div>
        <div v-if="connected" class="messages">
            <div v-for="(message, index) in messages" :key="index" class="message">
                {{ message }}
            </div>
        </div>
        <div class="controls" v-if="connected">
            <input v-model="messageInput" placeholder="Entrez un message..." />
            <button @click="sendMessage" class="btn btn-primary btn-sm">Envoyer</button>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            socket: null,
            connected: false,
            connecting: false,
            messages: [],
            messageInput: '',
        };
    },
    computed: {
        connectionStatusClass() {
            if (this.connected) {
                return 'connected';
            } else if (this.connecting) {
                return 'connecting';
            } else {
                return 'disconnected';
            }
        },
        connectionStatusText() {
            if (this.connected) {
                return 'WebSocket Connecté';
            } else if (this.connecting) {
                return 'Connexion en cours...';
            } else {
                return 'WebSocket Déconnecté';
            }
        }
    },
    mounted() {
        this.connectWebSocket();
    },
    beforeUnmount() {
        this.disconnectWebSocket();
    },
    methods: {
        connectWebSocket() {
            this.connecting = true;
            
            // Détermine le bon protocole (ws ou wss) en fonction du protocole actuel
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            try {
                this.socket = new WebSocket(wsUrl);
                
                this.socket.onopen = () => {
                    this.connected = true;
                    this.connecting = false;
                    this.messages.push('Connecté au serveur WebSocket');
                };
                
                this.socket.onmessage = (event) => {
                    this.messages.push(`Reçu: ${event.data}`);
                    // Limiter le nombre de messages affichés
                    if (this.messages.length > 10) {
                        this.messages.shift();
                    }
                };
                
                this.socket.onclose = () => {
                    this.connected = false;
                    this.connecting = false;
                    this.messages.push('Déconnecté du serveur WebSocket');
                };
                
                this.socket.onerror = (error) => {
                    console.error('Erreur WebSocket:', error);
                    this.connected = false;
                    this.connecting = false;
                    this.messages.push('Erreur de connexion WebSocket');
                };
            } catch (error) {
                console.error('Erreur lors de la création du WebSocket:', error);
                this.connected = false;
                this.connecting = false;
                this.messages.push('Impossible de créer la connexion WebSocket');
            }
        },
        
        disconnectWebSocket() {
            if (this.socket) {
                this.socket.close();
                this.socket = null;
                this.connected = false;
            }
        },
        
        sendMessage() {
            if (this.socket && this.connected && this.messageInput.trim()) {
                this.socket.send(this.messageInput);
                this.messages.push(`Envoyé: ${this.messageInput}`);
                this.messageInput = '';
            }
        }
    }
};
</script>

<style lang="scss" scoped>
.websocket-status {
    padding: 15px;
    border-radius: 8px;
    background-color: #f8f9fa;
    margin-bottom: 15px;
    
    .status-indicator {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            
            &.connected {
                background-color: #5CDD8B; // Vert
            }
            
            &.connecting {
                background-color: #F5B617; // Jaune/Orange
                animation: pulse 1.5s infinite;
            }
            
            &.disconnected {
                background-color: #DC3545; // Rouge
            }
        }
    }
    
    .messages {
        max-height: 150px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 10px;
        margin-bottom: 10px;
        background-color: white;
        
        .message {
            padding: 5px 0;
            border-bottom: 1px solid #f0f0f0;
            
            &:last-child {
                border-bottom: none;
            }
        }
    }
    
    .controls {
        display: flex;
        gap: 10px;
        
        input {
            flex: 1;
            padding: 6px 12px;
            border: 1px solid #ced4da;
            border-radius: 4px;
        }
    }
}

@keyframes pulse {
    0% {
        opacity: 0.5;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0.5;
    }
}
</style>