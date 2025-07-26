#!/usr/bin/env node

const Bot = require('./bot');
const config = require('./config');
const logger = require('./logger');

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    if (bot) {
        bot.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    if (bot) {
        bot.stop();
    }
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

async function main() {
    logger.info('Starting Aternos Bedrock Keep-Alive Bot...');
    logger.info(`Server: ${config.SERVER_HOST}:${config.SERVER_PORT}`);
    logger.info(`Username: ${config.USERNAME}`);
    logger.info(`Action Interval: ${config.ACTION_INTERVAL}ms`);
    
    const bot = new Bot(config);
    
    try {
        await bot.start();
    } catch (error) {
        logger.error('Failed to start bot:', error);
        process.exit(1);
    }
}

// Start the bot
main();
