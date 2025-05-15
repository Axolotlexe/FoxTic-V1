const { R } = require("redbean-node");
const { log } = require("../util-server");
const { checkLogin } = require("../util-server");
const Monitor = require("../model/monitor");

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

            log.debug("group", `Exporting groups: ${groupIDs.join(", ")}`);
            
            // Get the groups to export
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
            
            // Validate the import data
            if (!importData || !importData.groups || !Array.isArray(importData.groups)) {
                throw new Error("Invalid import data format");
            }
            
            log.debug("group", "Importing groups");
            
            const result = await importGroups(socket.userID, importData);
            
            callback({
                ok: true,
                msg: `Successfully imported ${result.groupCount} groups with ${result.monitorCount} monitors`
            });
            
        } catch (error) {
            log.error("group", "Import error: " + error.message);
            callback({
                ok: false,
                msg: error.message
            });
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
        }
        
        if (groups.length === 0) {
            throw new Error("No valid groups found to export");
        }
        
        // Get all monitors associated with these groups
        const exportGroups = [];
        const timestamp = Math.floor(Date.now() / 1000); // Export timestamp
        
        for (const group of groups) {
            // Remove sensitive/irrelevant fields
            delete group.id;
            delete group.user_id;
            
            // Add the group to the export list
            const exportGroup = {
                ...group,
                monitors: []
            };
            
            // Get all monitors in this group
            const monitors = await R.find("monitor", " parent = ? AND user_id = ? AND type != ? ", [
                group.id,
                userID,
                "group"
            ]);
            
            for (const monitor of monitors) {
                // Remove sensitive/irrelevant fields
                delete monitor.id;
                delete monitor.user_id;
                delete monitor.parent; // We'll restore this when importing
                
                exportGroup.monitors.push(monitor);
            }
            
            exportGroups.push(exportGroup);
        }
        
        return {
            version: 1, // Export version for compatibility checks
            timestamp,
            application: "FoxTic", // Indicates this is a FoxTic export
            groups: exportGroups
        };
    }
    
    /**
     * Import groups from exported data
     * @param {number} userID User ID
     * @param {Object} importData Data object containing groups to import
     * @returns {Object} Import results
     */
    async function importGroups(userID, importData) {
        let groupCount = 0;
        let monitorCount = 0;
        
        // Check export version compatibility
        if (importData.version > 1) {
            throw new Error(`Unsupported export version: ${importData.version}`);
        }
        
        // Verify this is a FoxTic export
        if (importData.application !== "FoxTic") {
            throw new Error("Invalid import file: This file was not exported from FoxTic");
        }
        
        // Import each group
        for (const exportedGroup of importData.groups) {
            // Create the group
            const group = R.dispense("monitor");
            
            // Set the group properties
            group.name = exportedGroup.name;
            group.type = "group";
            group.user_id = userID;
            group.active = 1;
            group.active_monitoring = 0;
            
            // Save the group to get its ID
            const groupID = await R.store(group);
            groupCount++;
            
            // Import the group's monitors
            if (exportedGroup.monitors && Array.isArray(exportedGroup.monitors)) {
                for (const exportedMonitor of exportedGroup.monitors) {
                    const monitor = R.dispense("monitor");
                    
                    // Copy all properties from the exported monitor
                    for (const key in exportedMonitor) {
                        monitor[key] = exportedMonitor[key];
                    }
                    
                    // Ensure this is a FoxTic monitor
                    monitor.foxtic_managed = 1;
                    
                    // Set the required fields
                    monitor.user_id = userID;
                    monitor.parent = groupID;
                    monitor.active = 1; // Set active by default
                    
                    await R.store(monitor);
                    monitorCount++;
                }
            }
        }
        
        return {
            groupCount,
            monitorCount
        };
    }
};