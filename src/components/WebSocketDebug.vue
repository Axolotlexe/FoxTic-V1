<template>
  <div class="websocket-debug">
    <div class="debug-header">
      <h3>État de la connexion WebSocket</h3>
      <div class="connection-status" :class="{ 'connected': isConnected, 'disconnected': !isConnected }">
        {{ isConnected ? 'Connecté' : 'Déconnecté' }}
      </div>
    </div>

    <div class="debug-controls">
      <button class="btn-primary" @click="connect" :disabled="isConnected">Connecter</button>
      <button class="btn-neutral" @click="sendPing" :disabled="!isConnected">Ping</button>
      <button class="btn-danger" @click="disconnect" :disabled="!isConnected">Déconnecter</button>
    </div>

    <div class="debug-logs">
      <h4>Journal de communication</h4>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-entry" :class="log.type">
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-type">{{ log.type.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import webSocketService from "../services/websocket.js";

export default {
  name: "WebSocketDebug",
  
  data() {
    return {
      isConnected: false,
      logs: [],
      maxLogs: 100
    };
  },
  
  created() {
    // Register event listeners
    webSocketService.on('connected', this.handleConnected);
    webSocketService.on('disconnected', this.handleDisconnected);
    webSocketService.on('error', this.handleError);
    webSocketService.on('pong', this.handlePong);
    
    // Connect automatically if auto-connect is enabled
    if (this.$route.query.autoConnect !== 'false') {
      this.connect();
    }
  },
  
  beforeUnmount() {
    // Clean up event listeners
    webSocketService.off('connected', this.handleConnected);
    webSocketService.off('disconnected', this.handleDisconnected);
    webSocketService.off('error', this.handleError);
    webSocketService.off('pong', this.handlePong);
    
    // Disconnect when component is destroyed
    this.disconnect();
  },
  
  methods: {
    connect() {
      this.addLog('info', 'Tentative de connexion...');
      webSocketService.connect();
    },
    
    disconnect() {
      if (webSocketService.isConnected()) {
        this.addLog('info', 'Déconnexion...');
        webSocketService.disconnect();
      }
    },
    
    sendPing() {
      this.addLog('outgoing', 'Envoi d\'un ping au serveur');
      webSocketService.ping();
    },
    
    handleConnected(data) {
      this.isConnected = true;
      this.addLog('success', 'Connexion établie avec le serveur');
    },
    
    handleDisconnected(data) {
      this.isConnected = false;
      this.addLog('error', `Déconnecté du serveur: ${data.event ? data.event.reason || 'Raison inconnue' : 'Raison inconnue'}`);
    },
    
    handleError(data) {
      this.addLog('error', `Erreur WebSocket: ${data.error}`);
    },
    
    handlePong(data) {
      this.addLog('incoming', 'Pong reçu du serveur');
    },
    
    addLog(type, message) {
      // Add log entry
      this.logs.unshift({
        type,
        message,
        timestamp: Date.now()
      });
      
      // Trim logs if necessary
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }
    },
    
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    }
  }
};
</script>

<style scoped>
.websocket-debug {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.connection-status {
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 4px;
}

.connected {
  background-color: #d4edda;
  color: #155724;
}

.disconnected {
  background-color: #f8d7da;
  color: #721c24;
}

.debug-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-neutral {
  background-color: #6c757d;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background-color: #fff;
}

.log-entry {
  margin-bottom: 5px;
  padding: 5px;
  border-radius: 3px;
  font-family: monospace;
  display: flex;
}

.log-time {
  min-width: 90px;
  color: #6c757d;
  margin-right: 8px;
}

.log-type {
  min-width: 80px;
  font-weight: bold;
  margin-right: 8px;
}

.log-message {
  flex-grow: 1;
}

.info {
  background-color: #e2e3e5;
}

.success {
  background-color: #d4edda;
}

.error {
  background-color: #f8d7da;
}

.outgoing {
  background-color: #d1ecf1;
}

.incoming {
  background-color: #fff3cd;
}
</style>