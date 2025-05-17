/**
 * FoxTic WebSocket service
 * Provides real-time monitor updates with automatic reconnection
 */

class WebSocketService {
    /**
     * Create a new WebSocket service
     */
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
        this.reconnectDelay = 3000; // 3 seconds
        this.listeners = {};
        this.silentReconnect = false;
    }

    /**
     * Connect to the WebSocket server
     * @returns {void}
     */
    connect() {
        if (this.socket) {
            return; // Already connected or connecting
        }

        // Use the correct protocol (wss:// for HTTPS, ws:// for HTTP)
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        console.log(`[WebSocket] Tentative de connexion à ${wsUrl}`);
        this.socket = new WebSocket(wsUrl);

        // Event handlers
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onclose = this.onClose.bind(this);
        this.socket.onerror = this.onError.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
    }

    /**
     * Handle WebSocket connection open
     * @param {Event} event WebSocket onopen event
     * @returns {void}
     */
    onOpen(event) {
        console.log("[WebSocket] Connexion établie");
        this.connected = true;
        this.reconnectAttempts = 0;
        this.silentReconnect = false;
        this.emit('connected', { event });
    }

    /**
     * Handle WebSocket connection close
     * @param {Event} event WebSocket onclose event
     * @returns {void}
     */
    onClose(event) {
        this.connected = false;
        this.socket = null;
        
        console.log(`[WebSocket] Connexion fermée. Code: ${event.code}, Raison: ${event.reason}`);
        
        if (!this.silentReconnect) {
            this.emit('disconnected', { event });
        }

        // Try to reconnect if not explicitly closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[WebSocket] Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${this.reconnectDelay}ms`);
            
            setTimeout(() => {
                // Only show reconnection messages after the first attempt
                this.silentReconnect = this.reconnectAttempts > 1;
                this.connect();
            }, this.reconnectDelay);
        }
    }

    /**
     * Handle WebSocket errors
     * @param {Event} error WebSocket onerror event
     * @returns {void}
     */
    onError(error) {
        console.error("[WebSocket] Erreur:", error);
        this.emit('error', { error });
        console.error("Erreur de connexion WebSocket:", error);
    }

    /**
     * Handle WebSocket messages
     * @param {MessageEvent} event WebSocket onmessage event
     * @returns {void}
     */
    onMessage(event) {
        try {
            const data = JSON.parse(event.data);
            this.emit(data.type, data);
        } catch (error) {
            console.error("[WebSocket] Erreur de traitement du message:", error);
        }
    }

    /**
     * Send data to the WebSocket server
     * @param {string} type Message type
     * @param {Object} data Data to send
     * @returns {boolean} True if sent, false otherwise
     */
    send(type, data = {}) {
        if (!this.connected) {
            console.warn("[WebSocket] Impossible d'envoyer le message, non connecté");
            return false;
        }

        const message = JSON.stringify({
            type,
            ...data,
            timestamp: Date.now()
        });

        try {
            this.socket.send(message);
            return true;
        } catch (error) {
            console.error("[WebSocket] Erreur d'envoi:", error);
            return false;
        }
    }

    /**
     * Register event listener
     * @param {string} event Event name
     * @param {Function} callback Event callback
     * @returns {void}
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event Event name
     * @param {Function} callback Event callback
     * @returns {void}
     */
    off(event, callback) {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emit event to listeners
     * @param {string} event Event name
     * @param {Object} data Event data
     * @returns {void}
     */
    emit(event, data) {
        if (!this.listeners[event]) {
            return;
        }
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[WebSocket] Erreur dans le gestionnaire d'événements ${event}:`, error);
            }
        });
    }

    /**
     * Disconnect from the WebSocket server
     * @returns {void}
     */
    disconnect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close(1000, "Déconnexion volontaire");
        }
        this.socket = null;
        this.connected = false;
    }

    /**
     * Check if the WebSocket is connected
     * @returns {boolean} True if connected, false otherwise
     */
    isConnected() {
        return this.connected && this.socket && this.socket.readyState === WebSocket.OPEN;
    }

    /**
     * Send a ping to keep the connection alive
     * @returns {void}
     */
    ping() {
        this.send('ping');
    }
}

// Singleton instance
const webSocketService = new WebSocketService();

// Export the service
export default webSocketService;