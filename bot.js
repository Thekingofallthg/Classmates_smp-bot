const bedrock = require('bedrock-protocol');
const logger = require('./logger');

class AternosKeepAliveBot {
    constructor(config) {
        this.config = config;
        this.client = null;
        this.isRunning = false;
        this.reconnectAttempts = 0;
        this.actionInterval = null;
        this.reconnectTimeout = null;
        this.isSneaking = false;
        this.position = { x: 0, y: 64, z: 0 };
    }

    async start() {
        logger.info('Starting bot...');
        this.isRunning = true;
        return this.connect();
    }

    stop() {
        logger.info('Stopping bot...');
        this.isRunning = false;
        
        if (this.actionInterval) {
            clearInterval(this.actionInterval);
            this.actionInterval = null;
        }
        
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        
        if (this.client) {
            try {
                this.client.disconnect();
            } catch (error) {
                logger.warn('Error disconnecting client:', error.message);
            }
            this.client = null;
        }
    }

    async connect() {
        if (!this.isRunning) return;

        logger.info(`Connecting to ${this.config.SERVER_HOST}:${this.config.SERVER_PORT}...`);
        
        try {
            this.client = bedrock.createClient({
                host: this.config.SERVER_HOST,
                port: this.config.SERVER_PORT,
                username: this.config.USERNAME,
                offline: true, // Use offline mode for simplicity
                version: '1.21.72' // Specific Bedrock version
            });

            this.setupEventHandlers();
            
            // Set connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.client && !this.client.spawned) {
                    logger.error('Connection timeout');
                    this.handleDisconnect('Connection timeout');
                }
            }, this.config.CONNECTION_TIMEOUT);

            // Wait for spawn
            await new Promise((resolve, reject) => {
                this.client.once('spawn', () => {
                    clearTimeout(connectionTimeout);
                    logger.info('Successfully connected and spawned!');
                    resolve();
                });
                
                this.client.once('disconnect', (reason) => {
                    clearTimeout(connectionTimeout);
                    reject(new Error(`Disconnected before spawn: ${reason}`));
                });
                
                this.client.once('error', (error) => {
                    clearTimeout(connectionTimeout);
                    reject(error);
                });
            });

            this.reconnectAttempts = 0;
            this.startKeepAliveActions();

        } catch (error) {
            logger.error('Connection failed:', error.message);
            this.handleDisconnect(error.message);
        }
    }

    setupEventHandlers() {
        this.client.on('spawn', () => {
            logger.info('Bot spawned in the world');
        });

        this.client.on('disconnect', (reason) => {
            logger.warn('Disconnected from server:', reason);
            this.handleDisconnect(reason);
        });

        this.client.on('error', (error) => {
            logger.error('Client error:', error.message);
            this.handleDisconnect(error.message);
        });

        this.client.on('kick', (reason) => {
            logger.warn('Kicked from server:', reason);
            this.handleDisconnect(`Kicked: ${reason}`);
        });

        // Log chat messages (optional, for monitoring)
        this.client.on('text', (packet) => {
            if (packet.type === 'chat' && packet.source_name !== this.config.USERNAME) {
                logger.debug(`Chat: <${packet.source_name}> ${packet.message}`);
            }
        });

        // Track position updates
        this.client.on('move_player', (packet) => {
            if (packet.runtime_entity_id === this.client.entityId) {
                this.position = {
                    x: packet.position.x,
                    y: packet.position.y,
                    z: packet.position.z
                };
            }
        });
    }

    startKeepAliveActions() {
        if (this.actionInterval) {
            clearInterval(this.actionInterval);
        }

        logger.info(`Starting keep-alive actions every ${this.config.ACTION_INTERVAL}ms`);
        
        this.actionInterval = setInterval(() => {
            this.performKeepAliveAction();
        }, this.config.ACTION_INTERVAL);
    }

    performKeepAliveAction() {
        if (!this.client || !this.client.spawned || !this.isRunning) {
            return;
        }

        try {
            // Toggle sneaking state
            this.isSneaking = !this.isSneaking;
            
            // Send player action packet for sneaking/unsneaking (Bedrock format)
            this.client.write('player_action', {
                runtime_entity_id: this.client.entityId,
                action: this.isSneaking ? 'start_sneak' : 'stop_sneak',
                position: { x: 0, y: 0, z: 0 },
                face: 0
            });

            logger.debug(`Performed keep-alive action: ${this.isSneaking ? 'sneak' : 'unsneak'}`);
            
            // Also send a move packet to ensure activity (Bedrock format)
            this.client.write('move_player', {
                runtime_entity_id: this.client.entityId,
                position: this.position,
                pitch: 0,
                yaw: 0,
                head_yaw: 0,
                mode: 'normal',
                on_ground: true,
                ridden_runtime_entity_id: 0,
                teleport_cause: 'unknown',
                teleport_source_type: 0
            });

        } catch (error) {
            logger.error('Error performing keep-alive action:', error.message);
        }
    }

    handleDisconnect(reason) {
        if (this.actionInterval) {
            clearInterval(this.actionInterval);
            this.actionInterval = null;
        }

        if (this.client) {
            this.client = null;
        }

        if (!this.isRunning) {
            return;
        }

        // Check if we should attempt reconnection
        if (this.config.MAX_RECONNECT_ATTEMPTS > 0 && 
            this.reconnectAttempts >= this.config.MAX_RECONNECT_ATTEMPTS) {
            logger.error(`Max reconnection attempts (${this.config.MAX_RECONNECT_ATTEMPTS}) reached. Stopping bot.`);
            this.stop();
            return;
        }

        this.reconnectAttempts++;
        logger.info(`Attempting reconnection ${this.reconnectAttempts}/${this.config.MAX_RECONNECT_ATTEMPTS || '∞'} in ${this.config.RECONNECT_DELAY}ms...`);

        this.reconnectTimeout = setTimeout(() => {
            if (this.isRunning) {
                this.connect();
            }
        }, this.config.RECONNECT_DELAY);
    }
}

module.exports = AternosKeepAliveBot;
