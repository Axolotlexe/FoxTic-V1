/**
 * FoxTic Secure RADIUS Client
 * 
 * Ce module est une alternative sécurisée à node-radius-client
 * qui évite l'utilisation des bibliothèques vulnérables (hoek, joi, topo)
 * en implémentant seulement les fonctionnalités essentielles.
 */

const dgram = require('dgram');
const crypto = require('crypto');

// Codes for RADIUS packets
const RADIUS_CODES = {
    ACCESS_REQUEST: 1,
    ACCESS_ACCEPT: 2,
    ACCESS_REJECT: 3,
    ACCESS_CHALLENGE: 4
};

// Common RADIUS attributes 
const RADIUS_ATTRIBUTES = {
    USER_NAME: 1,
    USER_PASSWORD: 2,
    CALLING_STATION_ID: 31,
    CALLED_STATION_ID: 30
};

/**
 * Secure RADIUS Client implementation
 */
class SecureRadiusClient {
    /**
     * Creates a new RADIUS client
     * @param {object} options Client configuration
     * @param {string} options.host RADIUS server hostname
     * @param {number} options.hostPort RADIUS server port
     * @param {number} options.timeout Request timeout in milliseconds
     * @param {number} options.retries Number of retries
     */
    constructor(options) {
        this.host = options.host;
        this.port = options.hostPort || 1812;
        this.timeout = options.timeout || 3000;
        this.retries = options.retries || 1;
    }

    /**
     * Send an Access-Request to the RADIUS server
     * @param {object} options Request options
     * @param {string} options.secret RADIUS shared secret
     * @param {Array} options.attributes RADIUS attributes for the request
     * @returns {Promise<object>} Promise that resolves to the response
     */
    accessRequest(options) {
        return new Promise((resolve, reject) => {
            const socket = dgram.createSocket('udp4');
            const secret = options.secret;
            
            // Create a request ID
            const id = Math.floor(Math.random() * 256);
            
            // Build packet
            const packet = this._buildAccessRequestPacket(id, secret, options.attributes);
            
            // Set timeout
            const timeoutId = setTimeout(() => {
                socket.close();
                reject(new Error('RADIUS request timed out'));
            }, this.timeout);
            
            // Handle responses
            socket.on('message', (message) => {
                clearTimeout(timeoutId);
                socket.close();
                
                try {
                    const response = this._parseResponse(message, id, secret);
                    resolve(response);
                } catch (error) {
                    reject(error);
                }
            });
            
            // Handle errors
            socket.on('error', (error) => {
                clearTimeout(timeoutId);
                socket.close();
                reject(error);
            });
            
            // Send the packet
            socket.send(packet, this.port, this.host, (error) => {
                if (error) {
                    clearTimeout(timeoutId);
                    socket.close();
                    reject(error);
                }
            });
        });
    }
    
    /**
     * Build a RADIUS Access-Request packet
     * @param {number} id Request ID
     * @param {string} secret RADIUS shared secret
     * @param {Array} attributes RADIUS attributes
     * @returns {Buffer} RADIUS packet
     * @private
     */
    _buildAccessRequestPacket(id, secret, attributes) {
        // Create 16-byte authenticator
        const authenticator = crypto.randomBytes(16);
        
        // Calculate packet length: 20 bytes (header) + attributes length
        let attributesBuffers = [];
        let attributesLength = 0;
        
        // Process attributes
        for (const [type, value] of attributes) {
            if (type === RADIUS_ATTRIBUTES.USER_PASSWORD) {
                // Handle password encryption
                const encryptedPassword = this._encryptPassword(value, secret, authenticator);
                const attrBuffer = Buffer.alloc(2 + encryptedPassword.length);
                attrBuffer.writeUInt8(type, 0);
                attrBuffer.writeUInt8(2 + encryptedPassword.length, 1);
                encryptedPassword.copy(attrBuffer, 2);
                attributesBuffers.push(attrBuffer);
                attributesLength += attrBuffer.length;
            } else {
                // Handle other attributes
                const valueBuffer = Buffer.from(String(value));
                const attrBuffer = Buffer.alloc(2 + valueBuffer.length);
                attrBuffer.writeUInt8(type, 0);
                attrBuffer.writeUInt8(2 + valueBuffer.length, 1);
                valueBuffer.copy(attrBuffer, 2);
                attributesBuffers.push(attrBuffer);
                attributesLength += attrBuffer.length;
            }
        }
        
        // Create packet
        const packet = Buffer.alloc(20 + attributesLength);
        
        // Write header
        packet.writeUInt8(RADIUS_CODES.ACCESS_REQUEST, 0); // Code: Access-Request
        packet.writeUInt8(id, 1); // ID
        packet.writeUInt16BE(packet.length, 2); // Length
        authenticator.copy(packet, 4); // Authenticator
        
        // Write attributes
        let offset = 20;
        for (const attrBuffer of attributesBuffers) {
            attrBuffer.copy(packet, offset);
            offset += attrBuffer.length;
        }
        
        return packet;
    }
    
    /**
     * Encrypt a password using RADIUS algorithm
     * @param {string} password Password to encrypt
     * @param {string} secret RADIUS shared secret
     * @param {Buffer} authenticator Request authenticator
     * @returns {Buffer} Encrypted password
     * @private
     */
    _encryptPassword(password, secret, authenticator) {
        const secretBuffer = Buffer.from(secret);
        const passwordBuffer = Buffer.from(password);
        
        // Pad password to multiple of 16 bytes
        const paddedPasswordLength = Math.ceil(passwordBuffer.length / 16) * 16;
        const paddedPassword = Buffer.alloc(paddedPasswordLength, 0);
        passwordBuffer.copy(paddedPassword);
        
        // Encrypt password
        const encryptedPassword = Buffer.alloc(paddedPasswordLength);
        let lastBlock = authenticator;
        
        for (let i = 0; i < paddedPasswordLength; i += 16) {
            const block = paddedPassword.slice(i, i + 16);
            
            // Create hash for this block
            const hash = crypto.createHash('md5');
            hash.update(secretBuffer);
            hash.update(lastBlock);
            const hashDigest = hash.digest();
            
            // XOR the block with the hash
            for (let j = 0; j < 16; j++) {
                encryptedPassword[i + j] = block[j] ^ hashDigest[j];
            }
            
            // Update lastBlock for next iteration
            lastBlock = encryptedPassword.slice(i, i + 16);
        }
        
        return encryptedPassword;
    }
    
    /**
     * Parse a RADIUS response packet
     * @param {Buffer} message Response message
     * @param {number} requestId Request ID
     * @param {string} secret RADIUS shared secret
     * @returns {object} Parsed response
     * @private
     */
    _parseResponse(message, requestId, secret) {
        // Validate basic packet structure
        if (message.length < 20) {
            throw new Error('Invalid RADIUS packet: too short');
        }
        
        const code = message.readUInt8(0);
        const id = message.readUInt8(1);
        const length = message.readUInt16BE(2);
        
        // Verify ID matches
        if (id !== requestId) {
            throw new Error(`Invalid RADIUS packet: ID mismatch (got ${id}, expected ${requestId})`);
        }
        
        // Verify length
        if (length !== message.length) {
            throw new Error(`Invalid RADIUS packet: length mismatch (got ${message.length}, expected ${length})`);
        }
        
        // Map response code to a string
        let responseCode;
        switch (code) {
            case RADIUS_CODES.ACCESS_ACCEPT:
                responseCode = 'accept';
                break;
            case RADIUS_CODES.ACCESS_REJECT:
                responseCode = 'reject';
                break;
            case RADIUS_CODES.ACCESS_CHALLENGE:
                responseCode = 'challenge';
                break;
            default:
                throw new Error(`Invalid RADIUS packet: unknown code ${code}`);
        }
        
        // Parse attributes
        const attributes = {};
        let position = 20;
        
        while (position < length) {
            const type = message.readUInt8(position);
            const attrLength = message.readUInt8(position + 1);
            
            if (attrLength < 2) {
                throw new Error(`Invalid RADIUS attribute: length too small (${attrLength})`);
            }
            
            if (position + attrLength > length) {
                throw new Error('Invalid RADIUS attribute: exceeds packet boundary');
            }
            
            const valueBuffer = message.slice(position + 2, position + attrLength);
            
            // Store attribute
            if (!attributes[type]) {
                attributes[type] = [];
            }
            attributes[type].push(valueBuffer.toString());
            
            position += attrLength;
        }
        
        return {
            code: responseCode,
            attributes
        };
    }
}

/**
 * Create a RADIUS client with the specified configuration
 * @param {object} options Client configuration
 * @returns {SecureRadiusClient} New RADIUS client
 */
exports.createClient = function(options) {
    return new SecureRadiusClient(options);
};

/**
 * RADIUS attribute identifiers
 */
exports.attributes = RADIUS_ATTRIBUTES;