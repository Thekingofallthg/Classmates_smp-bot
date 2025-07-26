const config = {
    // Server connection details
    SERVER_HOST: process.env.SERVER_HOST || 'ClassmatesSmp_Revive.aternos.me',
    SERVER_PORT: parseInt(process.env.SERVER_PORT) || 30710,
    
    // Bot credentials
    USERNAME: process.env.USERNAME || 'KeepAliveBot',
    
    // Bot behavior settings
    ACTION_INTERVAL: parseInt(process.env.ACTION_INTERVAL) || 5000, // 5 seconds
    RECONNECT_DELAY: parseInt(process.env.RECONNECT_DELAY) || 10000, // 10 seconds
    MAX_RECONNECT_ATTEMPTS: parseInt(process.env.MAX_RECONNECT_ATTEMPTS) || 0, // 0 = infinite
    
    // Connection timeout settings
    CONNECTION_TIMEOUT: parseInt(process.env.CONNECTION_TIMEOUT) || 30000, // 30 seconds
    
    // Logging level
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Validate required configuration
if (!config.SERVER_HOST) {
    throw new Error('SERVER_HOST is required');
}

if (!config.USERNAME) {
    throw new Error('USERNAME is required');
}

module.exports = config;
