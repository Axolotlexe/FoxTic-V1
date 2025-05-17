/**
 * Service de gestion des WebSockets pour la communication temps réel
 */

class WebSocketService {
    constructor() {
        this.socket = null;
        this.reconnectInterval = 3000; // 3 secondes
        this.isConnecting = false;
        this._hasLoggedConnectionStatus = false;
        this.eventHandlers = {
            message: [],
            open: [],
            close: [],
            error: []
        };
    }

    /**
     * Initialise la connexion WebSocket
     * @returns {Promise<void>}
     */
    connect() {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            // En production, on ne loggera pas ce message pour éviter de surcharger la console
            if (process.env.NODE_ENV === 'development' && !this._hasLoggedConnectionStatus) {
                console.log('[WebSocket] Déjà connecté ou en cours de connexion');
                this._hasLoggedConnectionStatus = true;
                // Réinitialiser après un délai
                setTimeout(() => { this._hasLoggedConnectionStatus = false; }, 5000);
            }
            return Promise.resolve();
        }

        if (this.isConnecting) {
            return Promise.resolve();
        }

        this.isConnecting = true;

        return new Promise((resolve, reject) => {
            try {
                // Utiliser le même hôte et port que l'application web actuelle
                const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
                const wsUrl = `${protocol}//${window.location.host}/ws`;
                
                // Fallback au cas où le WebSocket n'est pas disponible sur le même port
                const useMainSocket = true; // Utiliser le Socket.io principal au lieu du WebSocket dédié
                
                console.log(`[WebSocket] Tentative de connexion à ${wsUrl}`);
                this.socket = new WebSocket(wsUrl);

                this.socket.onopen = (event) => {
                    console.log('[WebSocket] Connexion établie');
                    this.isConnecting = false;
                    // Réinitialiser le compteur de tentatives lors d'une connexion réussie
                    this._reconnectAttempts = 0;
                    this._triggerEvent('open', event);
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    const data = event.data;
                    console.log(`[WebSocket] Message reçu: ${data}`);
                    this._triggerEvent('message', data);
                };

                this.socket.onclose = (event) => {
                    console.log(`[WebSocket] Connexion fermée. Code: ${event.code}, Raison: ${event.reason}`);
                    this.isConnecting = false;
                    this._triggerEvent('close', event);
                    
                    // Initialiser le compteur de tentatives si nécessaire
                    if (!this._reconnectAttempts) {
                        this._reconnectAttempts = 0;
                    }
                    
                    // Limiter les tentatives de reconnexion
                    if (this._reconnectAttempts < 3) {
                        this._reconnectAttempts++;
                        console.log(`[WebSocket] Tentative de reconnexion ${this._reconnectAttempts}/3 dans ${this.reconnectInterval}ms`);
                        setTimeout(() => this.connect(), this.reconnectInterval);
                    } else {
                        console.log('[WebSocket] Nombre maximum de tentatives de reconnexion atteint');
                    }
                };

                this.socket.onerror = (error) => {
                    // En mode production, on ne loggera pas toutes les erreurs WebSocket
                    if (process.env.NODE_ENV === 'development') {
                        console.error('[WebSocket] Erreur:', error);
                    } else {
                        // En production, juste un log discret
                        console.log('[WebSocket] Connexion interrompue, tentative de reconnexion...');
                    }
                    
                    this.isConnecting = false;
                    this._triggerEvent('error', error);
                    reject(error);
                };
            } catch (error) {
                console.error('[WebSocket] Erreur lors de la création de la connexion:', error);
                this.isConnecting = false;
                reject(error);
            }
        });
    }

    /**
     * Envoie un message au serveur WebSocket
     * @param {string|object} message - Message à envoyer (sera converti en JSON si c'est un objet)
     * @returns {boolean} - Succès de l'envoi
     */
    send(message) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('[WebSocket] Tentative d\'envoi sans connexion active');
            return false;
        }

        try {
            const messageToSend = typeof message === 'object' ? JSON.stringify(message) : message;
            this.socket.send(messageToSend);
            return true;
        } catch (error) {
            console.error('[WebSocket] Erreur lors de l\'envoi du message:', error);
            return false;
        }
    }

    /**
     * Ferme la connexion WebSocket
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    /**
     * Ajoute un écouteur d'événement
     * @param {string} event - Nom de l'événement ('message', 'open', 'close', 'error')
     * @param {Function} callback - Fonction de rappel
     */
    on(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(callback);
        }
    }

    /**
     * Supprime un écouteur d'événement
     * @param {string} event - Nom de l'événement
     * @param {Function} callback - Fonction de rappel à supprimer
     */
    off(event, callback) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Déclenche un événement pour tous les écouteurs
     * @param {string} event - Nom de l'événement
     * @param {any} data - Données à passer aux écouteurs
     * @private
     */
    _triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[WebSocket] Erreur dans un gestionnaire d'événement ${event}:`, error);
                }
            });
        }
    }
}

// Exporter une instance unique pour toute l'application
export const websocketService = new WebSocketService();

// Exporter le service pour les tests
export default WebSocketService;