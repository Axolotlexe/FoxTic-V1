/**
 * Module Proxy FoxTic simplifié
 * Fonctionnalité proxy désactivée pour optimiser les performances
 */

class Proxy {
    /**
     * Créer des agents HTTP désactivés pour FoxTic
     * @returns {object} Agents vides
     */
    static createAgents() {
        return {
            httpAgent: null,
            httpsAgent: null
        };
    }

    /**
     * Obtenir la liste des proxies (vide pour FoxTic)
     * @returns {Array} Liste vide
     */
    static async getProxyList() {
        return [];
    }
}

module.exports = {
    Proxy,
};