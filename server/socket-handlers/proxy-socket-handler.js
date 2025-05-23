const { log } = require("../../src/util");
const { disabledModules } = require("../config");

/**
 * Handlers for proxy - DÉSACTIVÉS
 * Module complètement désactivé pour optimiser les performances avec un grand nombre de sondes
 * @param {Socket} socket Socket.io instance
 * @returns {void}
 */
module.exports.proxySocketHandler = (socket) => {
    // Fonction désactivée pour optimisation des performances
    const sendModuleDisabledMessage = (callback) => {
        callback({
            ok: false,
            msg: "La fonctionnalité Proxy est désactivée pour optimiser les performances avec un grand nombre de sondes.",
        });
    };

    socket.on("addProxy", async (proxy, proxyID, callback) => {
        log.debug("proxy", "Tentative d'utilisation du module Proxy désactivé");
        sendModuleDisabledMessage(callback);
    });

    socket.on("deleteProxy", async (proxyID, callback) => {
        log.debug("proxy", "Tentative d'utilisation du module Proxy désactivé");
        sendModuleDisabledMessage(callback);
    });
    
    socket.on("getProxyList", async (callback) => {
        log.debug("proxy", "Tentative d'utilisation du module Proxy désactivé");
        callback({
            ok: true,
            proxyList: [],
        });
    });
};
