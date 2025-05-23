const isFreeBSD = /^freebsd/.test(process.platform);

// Interop with browser
const args = (typeof process !== "undefined") ? require("args-parser")(process.argv) : {};

// If host is omitted, the server will accept connections on the unspecified IPv6 address (::) when IPv6 is available and the unspecified IPv4 address (0.0.0.0) otherwise.
// Dual-stack support for (::)
// Also read HOST if not FreeBSD, as HOST is a system environment variable in FreeBSD
let hostEnv = isFreeBSD ? null : process.env.HOST;
const hostname = args.host || process.env.FOXTIC_HOST || process.env.UPTIME_KUMA_HOST || hostEnv;

const port = [ args.port, process.env.FOXTIC_PORT, process.env.UPTIME_KUMA_PORT, process.env.PORT, 3001 ]
    .map(portValue => parseInt(portValue))
    .find(portValue => !isNaN(portValue));

const sslKey = args["ssl-key"] || process.env.FOXTIC_SSL_KEY || process.env.UPTIME_KUMA_SSL_KEY || process.env.SSL_KEY || undefined;
const sslCert = args["ssl-cert"] || process.env.FOXTIC_SSL_CERT || process.env.UPTIME_KUMA_SSL_CERT || process.env.SSL_CERT || undefined;
const sslKeyPassphrase = args["ssl-key-passphrase"] || process.env.FOXTIC_SSL_KEY_PASSPHRASE || process.env.UPTIME_KUMA_SSL_KEY_PASSPHRASE || process.env.SSL_KEY_PASSPHRASE || undefined;

const isSSL = sslKey && sslCert;

/**
 * Get the local WebSocket URL
 * @returns {string} The local WebSocket URL
 */
function getLocalWebSocketURL() {
    const protocol = isSSL ? "wss" : "ws";
    const host = hostname || "localhost";
    return `${protocol}://${host}:${port}`;
}

const localWebSocketURL = getLocalWebSocketURL();

const demoMode = args["demo"] || false;

// Configuration des modules à désactiver
const disabledModules = {
    docker: true,           // Désactiver la gestion des hôtes Docker
    steamGameServer: true,  // Désactiver les moniteurs de serveurs de jeux Steam
    reverseProxy: true,     // Désactiver le support de reverse proxy avancé
    cloudflaredTunnel: true, // Désactiver le support des tunnels Cloudflare
    apiKeys: true,          // Désactiver la gestion des clés API
    remoteDevTools: true,   // Désactiver les outils de développement à distance
    browserRemote: true,    // Désactiver le support des navigateurs à distance
};

// Configuration pour optimiser les performances avec de nombreuses sondes (200+)
const performanceOptimizations = {
    reduceLogging: true,             // Réduire le niveau de journalisation
    increaseMonitorTimeout: 120000,  // Augmenter le délai d'expiration pour les moniteurs (ms) - doublé pour plus de robustesse
    socketPingInterval: 30000,       // Intervalle pour maintenir les connexions WebSocket (ms)
    maxWebSocketClients: 5,          // Réduit pour éviter la surcharge de connexions simultanées
    cacheTimeout: 600,               // Durée du cache augmentée (secondes)
    maxConcurrentChecks: 20,         // Limite de vérifications simultanées - ajustée pour éviter les saturations
    memoryOptimization: true,        // Activer les optimisations de mémoire
    batchUpdates: true,              // Regrouper les mises à jour multiples
    heartbeatLimit: 100,             // Limiter le nombre de battements de cœur stockés par moniteur
    checkDelay: true,                // Ajouter un délai léger entre les vérifications pour éviter les pics de charge
    reduceHistorySize: true,         // Réduire la taille de l'historique pour les installations avec beaucoup de sondes
    compressResponses: true,         // Compresser les réponses volumineuses
    incrementalLoading: true         // Charger les données de manière incrémentale dans l'interface
};

module.exports = {
    args,
    hostname,
    port,
    sslKey,
    sslCert,
    sslKeyPassphrase,
    isSSL,
    localWebSocketURL,
    demoMode,
    disabledModules,
    performanceOptimizations,
};
