<template>
    <div class="websocket-debug">
        <div class="card shadow-box">
            <div class="card-header">
                <h5>{{ $t('WebSocket Debug Console') }}</h5>
                <div class="connection-status" :class="{ 'connected': isConnected }">
                    {{ isConnected ? $t('Connected') : $t('Disconnected') }}
                </div>
            </div>
            <div class="card-body">
                <div class="messages-container">
                    <div v-if="messages.length === 0" class="no-messages">
                        {{ $t('No messages received yet') }}
                    </div>
                    <div v-else class="message-list">
                        <div v-for="(message, index) in messages" :key="index" class="message-item"
                             :class="{ 'sent': message.type === 'sent', 'received': message.type === 'received' }">
                            <div class="message-header">
                                <span class="message-type">{{ message.type === 'sent' ? $t('Sent') : $t('Received') }}</span>
                                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                            </div>
                            <pre class="message-content">{{ formatMessage(message.content) }}</pre>
                        </div>
                    </div>
                </div>
                <div class="message-input">
                    <textarea 
                        v-model="newMessage" 
                        :placeholder="$t('Enter a message to send...')"
                        @keydown.ctrl.enter="sendMessage"
                    ></textarea>
                    <div class="message-actions">
                        <button class="btn btn-primary" @click="sendMessage" :disabled="!isConnected || !newMessage.trim()">
                            {{ $t('Send') }}
                        </button>
                        <button class="btn btn-secondary" @click="connect" :disabled="isConnected">
                            {{ $t('Connect') }}
                        </button>
                        <button class="btn btn-danger" @click="disconnect" :disabled="!isConnected">
                            {{ $t('Disconnect') }}
                        </button>
                        <button class="btn btn-warning" @click="clearMessages">
                            {{ $t('Clear') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { websocketService } from '../services/websocket.js';
import dayjs from 'dayjs';

export default {
    name: 'WebSocketDebug',
    
    data() {
        return {
            isConnected: false,
            messages: [],
            newMessage: '',
            maxMessages: 50, // Maximum number of messages to display
        };
    },
    
    mounted() {
        // Add event listeners
        websocketService.on('open', this.handleConnectionOpen);
        websocketService.on('close', this.handleConnectionClose);
        websocketService.on('error', this.handleConnectionError);
        websocketService.on('message', this.handleMessageReceived);
        
        // Check if we should auto-connect
        if (localStorage.getItem('ws_autoconnect') === 'true') {
            this.connect();
        }
    },
    
    beforeUnmount() {
        // Clean up event listeners
        websocketService.off('open', this.handleConnectionOpen);
        websocketService.off('close', this.handleConnectionClose);
        websocketService.off('error', this.handleConnectionError);
        websocketService.off('message', this.handleMessageReceived);
    },
    
    methods: {
        /**
         * Connect to the WebSocket server
         */
        connect() {
            if (!this.isConnected) {
                websocketService.connect().catch(error => {
                    this.addMessage('system', `Error connecting: ${error.message || 'Unknown error'}`);
                });
            }
        },
        
        /**
         * Disconnect from the WebSocket server
         */
        disconnect() {
            if (this.isConnected) {
                websocketService.disconnect();
            }
        },
        
        /**
         * Handle the WebSocket open event
         */
        handleConnectionOpen() {
            this.isConnected = true;
            this.addMessage('system', 'Connection established');
        },
        
        /**
         * Handle the WebSocket close event
         */
        handleConnectionClose() {
            this.isConnected = false;
            this.addMessage('system', 'Connection closed');
        },
        
        /**
         * Handle the WebSocket error event
         * @param {Event} error - The error event
         */
        handleConnectionError(error) {
            this.isConnected = false;
            this.addMessage('system', `Connection error: ${error.message || 'Unknown error'}`);
        },
        
        /**
         * Handle incoming messages
         * @param {string} data - Message data received
         */
        handleMessageReceived(data) {
            this.addMessage('received', data);
        },
        
        /**
         * Send a message via WebSocket
         */
        sendMessage() {
            if (!this.isConnected || !this.newMessage.trim()) {
                return;
            }
            
            // Try to parse as JSON if it looks like JSON
            let messageToSend = this.newMessage.trim();
            
            try {
                // If the message starts with { or [, try to parse it as JSON
                if ((messageToSend.startsWith('{') && messageToSend.endsWith('}')) || 
                    (messageToSend.startsWith('[') && messageToSend.endsWith(']'))) {
                    // Parse to validate and then stringify to ensure proper formatting
                    JSON.parse(messageToSend);
                }
            } catch (e) {
                this.addMessage('error', `Invalid JSON format: ${e.message}`);
                return;
            }
            
            // Send the message
            const success = websocketService.send(messageToSend);
            
            if (success) {
                this.addMessage('sent', messageToSend);
                this.newMessage = ''; // Clear the input
            } else {
                this.addMessage('error', 'Failed to send message');
            }
        },
        
        /**
         * Add a message to the message list
         * @param {string} type - The message type ('sent', 'received', 'system', 'error')
         * @param {string} content - The message content
         */
        addMessage(type, content) {
            // Add the message to the list
            this.messages.push({
                type,
                content,
                timestamp: new Date()
            });
            
            // Limit the number of messages
            if (this.messages.length > this.maxMessages) {
                this.messages = this.messages.slice(-this.maxMessages);
            }
            
            // Scroll to bottom on next tick
            this.$nextTick(() => {
                const container = document.querySelector('.messages-container');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        },
        
        /**
         * Clear all messages from the console
         */
        clearMessages() {
            this.messages = [];
        },
        
        /**
         * Format a message for display
         * @param {string} message - The message to format
         * @returns {string} - The formatted message
         */
        formatMessage(message) {
            if (typeof message !== 'string') {
                return JSON.stringify(message, null, 2);
            }
            
            // If it looks like JSON, try to pretty-print it
            try {
                if ((message.startsWith('{') && message.endsWith('}')) || 
                    (message.startsWith('[') && message.endsWith(']'))) {
                    return JSON.stringify(JSON.parse(message), null, 2);
                }
            } catch (e) {
                // Not valid JSON, return as is
            }
            
            return message;
        },
        
        /**
         * Format a timestamp
         * @param {Date} timestamp - The timestamp to format
         * @returns {string} - The formatted timestamp
         */
        formatTime(timestamp) {
            return dayjs(timestamp).format('HH:mm:ss');
        }
    }
};
</script>

<style scoped>
.websocket-debug {
    margin: 20px 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.connection-status {
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: bold;
    background-color: #f8d7da;
    color: #721c24;
}

.connection-status.connected {
    background-color: #d4edda;
    color: #155724;
}

.messages-container {
    height: 300px;
    overflow-y: auto;
    margin-bottom: 15px;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 10px;
    background-color: #f8f9fa;
}

.no-messages {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #6c757d;
    font-style: italic;
}

.message-item {
    margin-bottom: 10px;
    padding: 8px 12px;
    border-radius: 4px;
    background-color: #f1f1f1;
    border-left: 4px solid #ced4da;
}

.message-item.sent {
    background-color: #e6f7ff;
    border-left-color: #1890ff;
}

.message-item.received {
    background-color: #f6ffed;
    border-left-color: #52c41a;
}

.message-item[data-type="system"] {
    background-color: #f2f2f2;
    border-left-color: #6c757d;
}

.message-item[data-type="error"] {
    background-color: #fff2f0;
    border-left-color: #ff4d4f;
}

.message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-size: 0.85rem;
}

.message-type {
    font-weight: bold;
}

.message-time {
    color: #6c757d;
}

.message-content {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    font-size: 0.9rem;
    padding: 8px;
    background-color: rgba(0, 0, 0, 0.03);
    border-radius: 3px;
    max-height: 200px;
    overflow-y: auto;
}

.message-input {
    margin-top: 15px;
}

.message-input textarea {
    width: 100%;
    min-height: 80px;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    resize: vertical;
}

.message-actions {
    display: flex;
    gap: 10px;
}

.message-actions button {
    padding: 6px 12px;
}
</style>