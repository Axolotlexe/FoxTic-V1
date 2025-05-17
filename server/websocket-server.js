/*
 * FoxTic WebSocket Server
 * Provides real-time updates for monitors
 */

const { WebSocketServer } = require('ws');
const WebSocket = require('ws');
const log = require("./util-server").log;

/**
 * Initialize the WebSocket server
 * @param {Object} httpServer - The HTTP server to attach to
 * @returns {WebSocketServer} The WebSocket server instance
 */
function initWebSocketServer(httpServer) {
    // Create a WebSocket server instance on a distinct path
    const wss = new WebSocketServer({ 
        server: httpServer, 
        path: '/ws' 
    });

    // Create a fallback logger in case the main logger isn't available
    const fallbackLog = {
        debug: console.debug || console.log,
        info: console.info || console.log,
        warn: console.warn || console.log,
        error: console.error || console.log
    };

    const logger = log || fallbackLog;

    // Connected clients
    const clients = new Set();

    // Handle new WebSocket connections
    wss.on('connection', (ws, req) => {
        const ip = req.socket.remoteAddress;
        logger.info("websocket", `New WebSocket connection from ${ip}`);
        
        // Add client to the connected clients set
        clients.add(ws);

        // Handle incoming messages
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                logger.debug("websocket", `Received message: ${JSON.stringify(data)}`);
                
                // Handle different message types
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong' }));
                }
            } catch (error) {
                logger.error("websocket", `Error handling message: ${error.message}`);
            }
        });

        // Handle disconnections
        ws.on('close', () => {
            logger.info("websocket", `WebSocket connection closed from ${ip}`);
            clients.delete(ws);
        });

        // Handle errors
        ws.on('error', (error) => {
            logger.error("websocket", `WebSocket error: ${error.message}`);
            clients.delete(ws);
        });

        // Send initial connection success message
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Connected to FoxTic WebSocket Server'
        }));
    });

    // Broadcast to all connected clients
    function broadcast(data) {
        const message = JSON.stringify(data);
        
        for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    }
    
    /**
     * Broadcast monitor status update to all connected clients
     * @param {number} monitorID ID of the monitor that was updated
     * @param {Object} monitorInfo Current monitor information
     * @param {Object} heartbeat Latest heartbeat information
     * @returns {void}
     */
    function broadcastMonitorUpdate(monitorID, monitorInfo, heartbeat) {
        broadcast({
            type: 'monitor_update',
            monitorID,
            status: heartbeat ? heartbeat.status : null,
            timestamp: Date.now(),
            data: {
                monitor: monitorInfo,
                heartbeat: heartbeat
            }
        });
        logger.debug("websocket", `Broadcasted update for monitor ${monitorID}`);
    }

    // Handle server errors
    wss.on('error', (error) => {
        logger.error("websocket", `WebSocket server error: ${error.message}`);
    });

    logger.info("websocket", "WebSocket server initialized on path: /ws");

    return {
        wss,
        broadcast,
        broadcastMonitorUpdate
    };
}

module.exports = {
    initWebSocketServer
};