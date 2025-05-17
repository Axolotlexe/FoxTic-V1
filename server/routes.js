// Import required modules
const express = require('express');
const WebSocket = require('ws').WebSocket;
const WebSocketServer = require('ws').WebSocketServer;
const dayjs = require('dayjs');

// Initialize the router
const router = express.Router();

// Initialize the websocket server
let wsServer = null;

// Collection temporaire d'abonnements aux groupes pour les notifications WebSocket
const groupSubscriptions = new Map();

// Function to setup WebSocket server
function setupWebSocket(httpServer) {
    // Create a WebSocket server instance
    wsServer = new WebSocketServer({ server: httpServer, path: '/ws' });

    // Handle WebSocket connections
    wsServer.on('connection', (socket) => {
        console.log('WebSocket client connected');

        // Handle messages from client
        socket.on('message', (message) => {
            const messageStr = message.toString();
            console.log(`Received message: ${messageStr}`);

            try {
                const parsedMessage = JSON.parse(messageStr);
                
                // Traiter les différents types de messages
                switch (parsedMessage.type) {
                    case 'request_status':
                        handleStatusRequest(socket, parsedMessage.data);
                        break;
                    
                    case 'monitor_update':
                        handleMonitorUpdate(socket, parsedMessage.data);
                        break;
                    
                    default:
                        // Echo pour les messages non reconnus
                        socket.send(JSON.stringify({
                            type: 'echo',
                            data: parsedMessage
                        }));
                }
            } catch (error) {
                console.error('Error processing WebSocket message:', error);
                
                // Message d'erreur au client
                socket.send(JSON.stringify({
                    type: 'error',
                    data: {
                        message: 'Erreur lors du traitement du message'
                    }
                }));
            }
        });

        // Handle disconnections
        socket.on('close', () => {
            console.log('WebSocket client disconnected');
        });

        // Send a welcome message
        socket.send(JSON.stringify({
            type: 'welcome',
            data: {
                message: 'Connected to FoxTic WebSocket server',
                timestamp: new Date().toISOString()
            }
        }));
    });

    return wsServer;
}

// Expose the WebSocket server instance
function getWebSocketServer() {
    return wsServer;
}

/**
 * Gère les demandes de statut des moniteurs
 * @param {WebSocket} socket - Socket client
 * @param {Object} data - Données de la demande
 * @returns {void}
 */
function handleStatusRequest(socket, data) {
    console.log('Handling status request:', data);
    
    try {
        // Si un ID de groupe est spécifié, enregistrer l'abonnement du client à ce groupe
        if (data && data.groupId) {
            const groupId = data.groupId.toString();
            
            if (!groupSubscriptions.has(groupId)) {
                groupSubscriptions.set(groupId, new Set());
            }
            
            // Ajouter ce socket aux abonnés du groupe
            groupSubscriptions.get(groupId).add(socket);
            
            console.log(`Client abonné au groupe ${groupId}`);
        }
        
        // Envoyer les données initiales
        // Dans un cas réel, on chargerait les données depuis la base de données
        socket.send(JSON.stringify({
            type: 'status_update',
            data: {
                timestamp: dayjs().format(),
                message: 'Statut initial des moniteurs'
                // Dans un cas réel, on ajouterait la liste des moniteurs ici
            }
        }));
    } catch (error) {
        console.error('Error handling status request:', error);
        
        socket.send(JSON.stringify({
            type: 'error',
            data: {
                message: 'Erreur lors de la récupération des statuts'
            }
        }));
    }
}

/**
 * Gère les mises à jour des moniteurs
 * @param {WebSocket} socket - Socket client
 * @param {Object} data - Données de la mise à jour
 * @returns {void}
 */
function handleMonitorUpdate(socket, data) {
    console.log('Handling monitor update:', data);
    
    try {
        // Traitement de la mise à jour
        // Dans un cas réel, on mettrait à jour la base de données
        
        // Diffuser la mise à jour aux clients concernés
        if (data && data.monitorId) {
            const monitorId = data.monitorId.toString();
            const groupId = data.groupId ? data.groupId.toString() : null;
            
            // Créer le message de mise à jour
            const updateMessage = JSON.stringify({
                type: 'monitor_update',
                data: {
                    monitorId: monitorId,
                    status: data.status,
                    timestamp: dayjs().format(),
                    message: data.message || 'Mise à jour du moniteur'
                }
            });
            
            // Si un groupe est spécifié, envoyer uniquement aux abonnés de ce groupe
            if (groupId && groupSubscriptions.has(groupId)) {
                groupSubscriptions.get(groupId).forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(updateMessage);
                    }
                });
            } else {
                // Sinon, diffuser à tous les clients
                broadcastToAll(updateMessage);
            }
        }
    } catch (error) {
        console.error('Error handling monitor update:', error);
        
        socket.send(JSON.stringify({
            type: 'error',
            data: {
                message: 'Erreur lors de la mise à jour du moniteur'
            }
        }));
    }
}

/**
 * Broadcast a message to all connected WebSocket clients
 * @param {string} message - Message to broadcast
 * @returns {void}
 */
function broadcastToAll(message) {
    if (wsServer) {
        wsServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

// Export functions and router
module.exports = {
    router,
    setupWebSocket,
    getWebSocketServer,
    broadcastToAll
};