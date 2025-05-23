const { log } = require("../../src/util");
const { disabledModules } = require("../config");

/**
 * Handlers for docker hosts - DÉSACTIVÉS
 * Module complètement désactivé pour optimiser les performances avec un grand nombre de sondes
 * @param {Socket} socket Socket.io instance
 * @returns {void}
 */
module.exports.dockerSocketHandler = (socket) => {
    // Fonction désactivée pour optimisation des performances
    const sendModuleDisabledMessage = (callback) => {
        callback({
            ok: false,
            msg: "La fonctionnalité Docker est désactivée pour optimiser les performances avec un grand nombre de sondes.",
        });
    };

    socket.on("addDockerHost", async (dockerHost, dockerHostID, callback) => {
        log.debug("docker", "Tentative d'utilisation du module Docker désactivé");
        sendModuleDisabledMessage(callback);
    });

    socket.on("deleteDockerHost", async (dockerHostID, callback) => {
        log.debug("docker", "Tentative d'utilisation du module Docker désactivé");
        sendModuleDisabledMessage(callback);
    });

    socket.on("testDockerHost", async (dockerHost, callback) => {
        log.debug("docker", "Tentative d'utilisation du module Docker désactivé");
        sendModuleDisabledMessage(callback);
    });
    
    socket.on("getDockerHostList", async (callback) => {
        log.debug("docker", "Tentative d'utilisation du module Docker désactivé");
        callback({
            ok: true,
            dockerHostList: [],
        });
    });
};
