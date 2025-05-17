const { R } = require("redbean-node");
const { checkLogin } = require("../util-server");
const Monitor = require("../model/monitor");
const { log } = require("../../src/util");

// Créer une fonction de journalisation sécurisée qui ne plantera jamais
const safeLog = {
    debug: (category, message) => {
        if (typeof log !== 'undefined' && typeof log.debug === 'function') {
            log.debug(category, message);
        } else {
            console.debug(`[${category}] ${message}`);
        }
    },
    info: (category, message) => {
        if (typeof log !== 'undefined' && typeof log.info === 'function') {
            log.info(category, message);
        } else {
            console.info(`[${category}] ${message}`);
        }
    },
    warn: (category, message) => {
        if (typeof log !== 'undefined' && typeof log.warn === 'function') {
            log.warn(category, message);
        } else {
            console.warn(`[${category}] ${message}`);
        }
    },
    error: (category, message) => {
        if (typeof log !== 'undefined' && typeof log.error === 'function') {
            log.error(category, message);
        } else {
            console.error(`[${category}] ${message}`);
        }
    }
};

/**
 * Group socket handler
 * @param {Socket} socket Socket.io socket instance
 * @returns {void}
 */
module.exports = (socket) => {

    socket.on("exportGroups", async (groupIDs, callback) => {
        try {
            checkLogin(socket);

            // Validate input
            if (!Array.isArray(groupIDs)) {
                throw new Error("Invalid group IDs");
            }

            safeLog.debug("group", `Exporting groups: ${groupIDs.join(", ")}`);
            
            // Get the groups to export - now in simpler format
            const exportData = await exportGroups(socket.userID, groupIDs);
            
            callback({
                ok: true,
                data: exportData
            });
            
        } catch (error) {
            callback({
                ok: false,
                msg: error.message
            });
        }
    });
    
    socket.on("importGroups", async (importData, callback) => {
        try {
            checkLogin(socket);
            
            // Validate the import data - accept new simplified format
            if (!importData || !Array.isArray(importData)) {
                throw new Error("Format de données d'importation invalide - tableau de groupes attendu");
            }
            
            safeLog.debug("group", "Importing groups using simplified format");
            
            // Handle the import within try/catch
            let result;
            try {
                result = await importGroups(socket.userID, importData);
            } catch (importError) {
                safeLog.error("group", "Import function error: " + (importError ? importError.toString() : "Unknown error"));
                throw new Error("Erreur lors de l'importation: " + (importError ? importError.message : "Erreur inconnue"));
            }
            
            if (!result) {
                throw new Error("Échec de l'importation: aucun résultat retourné");
            }
            
            callback({
                ok: true,
                msg: `${result.groupCount} groupes et ${result.monitorCount} moniteurs importés avec succès`
            });
            
        } catch (error) {
            // Handling all types of errors safely
            // Error might be null or undefined, create a safe object
            const safeError = error || new Error("Erreur inconnue lors de l'importation");
            const errorMsg = safeError.message || "Erreur inconnue lors de l'importation";
            
            // Utiliser notre logger sécurisé
            safeLog.error("group", "Import error: " + errorMsg);
            
            if (typeof callback === "function") {
                callback({
                    ok: false,
                    msg: errorMsg
                });
            } else {
                log.error("group", "Callback not available for error response");
            }
        }
    });
    
    /**
     * Export one or multiple groups
     * @param {number} userID User ID
     * @param {number[]} groupIDs Array of Group IDs to export
     * @returns {Object} Export data including groups and their monitors
     */
    async function exportGroups(userID, groupIDs) {
        // Get all groups to export
        let groups = [];
        
        if (groupIDs.length > 0) {
            groups = await R.find("monitor", " id IN (?) AND user_id = ? AND type = ? ", [
                groupIDs, 
                userID,
                "group"
            ]);
            
            safeLog.debug("group", `Found ${groups.length} groups to export`);
        }
        
        if (groups.length === 0) {
            throw new Error("No valid groups found to export");
        }
        
        // Create simplified export format
        const exportResult = [];
        
        for (const group of groups) {
            const groupId = group.id;
            const groupName = group.name;
            
            // Get all monitors in this group
            const monitors = await R.find("monitor", " parent = ? AND user_id = ? AND type != ? ", [
                groupId,
                userID,
                "group"
            ]);
            
            safeLog.debug("group", `Found ${monitors.length} monitors in group ${groupId}`);
            
            // Create simplified group object
            const exportGroup = {
                group: groupName,
                monitors: []
            };
            
            for (const monitor of monitors) {
                // Create a copy of the monitor to avoid modifying the original
                const exportMonitor = { ...monitor };
                
                // Remove sensitive/irrelevant fields
                delete exportMonitor.id;
                delete exportMonitor.user_id;
                delete exportMonitor.parent;
                delete exportMonitor.created_date;
                
                // Only keep useful fields
                exportGroup.monitors.push(exportMonitor);
            }
            
            exportResult.push(exportGroup);
        }
        
        safeLog.debug("group", `Export complete: ${exportResult.length} groups with monitors`);
        return exportResult;
    }
    
    /**
     * Import groups from exported data
     * @param {number} userID User ID
     * @param {Array} importData Array of groups with monitors using simplified format
     * @returns {Object} Import results
     */
    async function importGroups(userID, importData) {
        let groupCount = 0;
        let monitorCount = 0;
        
        try {
            // Check if data is valid
            if (!Array.isArray(importData) || importData.length === 0) {
                throw new Error("No groups found in import data");
            }
            
            safeLog.debug("group", `Found ${importData.length} groups in import data`);
            safeLog.debug("group", `Import data: ${JSON.stringify(importData).substring(0, 200)}...`);
            
            // Import each group using simplified format
            for (const groupData of importData) {
                if (!groupData || typeof groupData !== 'object') {
                    safeLog.debug("group", "Skipping invalid group in import data");
                    continue;
                }
                
                // Validate group format in simplified structure
                if (!groupData.group || typeof groupData.group !== 'string') {
                    // Support legacy format or other formats
                    if (groupData.name && typeof groupData.name === 'string') {
                        groupData.group = groupData.name;
                    } else {
                        safeLog.debug("group", "Group missing valid name property, skipping");
                        continue;
                    }
                }
                
                const groupName = groupData.group;
                
                // Check if group already exists
                let existingGroup = await R.findOne("monitor", " name = ? AND user_id = ? AND type = ? ", [
                    groupName,
                    userID,
                    "group"
                ]);
                
                let groupID;
                
                if (existingGroup) {
                    // Use existing group
                    safeLog.debug("group", `Group '${groupName}' already exists, using existing group`);
                    groupID = existingGroup.id;
                } else {
                    // Utiliser une méthode plus simple et fiable
                    const bean = R.dispense("monitor");
                    bean.name = groupName;
                    bean.type = "group";
                    bean.user_id = userID;
                    bean.active = 1;
                    
                    // Supprimer toute propriété active_monitoring si elle existe
                    if ('active_monitoring' in bean) {
                        delete bean.active_monitoring;
                    }
                    
                    // Enregistrer le bean et récupérer l'ID
                    const newGroupID = await R.store(bean);
                    
                    safeLog.debug("group", `Created new group using direct SQL: ${groupName} with ID ${newGroupID}`);
                    
                    // Use the new group ID
                    groupID = newGroupID;
                    groupCount++;
                    
                    safeLog.debug("group", `Created new group '${groupName}' with ID ${groupID}`);
                }
                
                // Import the group's monitors
                if (groupData.monitors && Array.isArray(groupData.monitors)) {
                    safeLog.debug("group", `Importing ${groupData.monitors.length} monitors for group '${groupName}'`);
                    
                    for (const monitorData of groupData.monitors) {
                        if (!monitorData || typeof monitorData !== 'object') {
                            safeLog.warn("group", "Skipping invalid monitor in import data");
                            continue;
                        }
                        
                        // Ensure monitor has a name
                        if (!monitorData.name) {
                            monitorData.name = "Imported Monitor " + Date.now();
                            safeLog.debug("group", "Monitor without name detected, using generated name");
                        }
                        
                        // Check if monitor already exists in group
                        const existingMonitor = await R.findOne("monitor", " name = ? AND user_id = ? AND parent = ? ", [
                            monitorData.name,
                            userID,
                            groupID
                        ]);
                        
                        if (existingMonitor) {
                            safeLog.debug("group", `Monitor '${monitorData.name}' already exists in group, skipping`);
                            continue;
                        }
                        
                        const monitor = R.dispense("monitor");
                        
                        // Copy all properties from the monitor data
                        for (const key in monitorData) {
                            if (key !== 'id' && key !== 'user_id' && key !== 'parent') {
                                monitor[key] = monitorData[key];
                            }
                        }
                        
                        // Make sure there's at least a valid type
                        if (!monitor.type || typeof monitor.type !== 'string') {
                            monitor.type = "http";
                            safeLog.warn("group", `Monitor without type detected, defaulting to 'http'`);
                        }
                        
                        // Ensure this is a FoxTic monitor
                        monitor.foxtic_managed = 1;
                        
                        // Set the required fields
                        monitor.user_id = userID;
                        monitor.parent = groupID;
                        monitor.active = 1; // Set active by default
                        
                        await R.store(monitor);
                        monitorCount++;
                        
                        safeLog.debug("group", `Added monitor '${monitorData.name}' to group`);
                    }
                }
            }
            
            safeLog.debug("group", `Import complete: ${groupCount} groups with ${monitorCount} monitors`);
            
            return {
                groupCount,
                monitorCount
            };
        } catch (error) {
            safeLog.error("group", "Import error: " + (error ? error.message : "Unknown error"));
            safeLog.debug("group", "Import data: " + JSON.stringify(importData).substring(0, 200) + "...");
            throw error;
        }
    }
};