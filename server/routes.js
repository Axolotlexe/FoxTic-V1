// Import required modules
const express = require('express');
const WebSocket = require('ws').WebSocket;
const WebSocketServer = require('ws').WebSocketServer;

// Initialize the router
const router = express.Router();

// Initialize the websocket server
let wsServer = null;

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

            // Broadcast message to all connected clients
            wsServer.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(`Server echo: ${messageStr}`);
                }
            });
        });

        // Handle disconnections
        socket.on('close', () => {
            console.log('WebSocket client disconnected');
        });

        // Send a welcome message
        socket.send('Connected to FoxTic WebSocket server');
    });

    return wsServer;
}

// Expose the WebSocket server instance
function getWebSocketServer() {
    return wsServer;
}

// Broadcast a message to all connected WebSocket clients
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