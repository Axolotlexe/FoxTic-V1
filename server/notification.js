const { R } = require("redbean-node");
const { log } = require("../src/util");

/**
 * Système de notification FoxTic simplifié
 * Tous les providers externes sont désactivés pour optimiser les performances
 * Focus sur le monitoring HTTP(s) avec notifications audio uniquement
 */
class Notification {

    providerList = {};

    static init() {
        log.debug("notification", "Notification providers disabled for FoxTic optimization");
    }

    /**
     * Envoie une notification
     * @param {BeanModel} notification Données de notification
     * @param {string} msg Message à envoyer
     * @param {BeanModel} monitorJSON Données du moniteur
     * @param {BeanModel} heartbeatJSON Données du heartbeat
     * @returns {Promise<string>} Résultat de l'envoi
     */
    static async send(notification, msg, monitorJSON = null, heartbeatJSON = null) {
        // Pour FoxTic, les notifications sont gérées par la bibliothèque de sons
        log.debug("notification", "External notifications disabled - using audio notification system");
        return "Audio notification system handles alerts";
    }

    /**
     * Obtenir la liste des providers disponibles
     * @returns {object} Liste vide pour FoxTic
     */
    static getProviderList() {
        return {};
    }

    /**
     * Check if provider est valide
     * @param {Notification} notification Instance de notification
     * @returns {boolean} Toujours false pour FoxTic
     */
    static checkProviderSupport(notification) {
        return false;
    }
}

module.exports = {
    Notification,
};