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
            log.error("group", "Import error: " + (error ? error.message : "Unknown error"));
            callback({
                ok: false,
                msg: error ? error.message : "An unknown error occurred during import"
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
        
        // Capture original IDs for reference
        const groupIdMap = {};
        
        if (groupIDs.length > 0) {
            groups = await R.find("monitor", " id IN (?) AND user_id = ? AND type = ? ", [
                groupIDs, 
                userID,
                "group"
            ]);
            
            // Save original IDs
            for (const group of groups) {
                groupIdMap[group.id] = true;
            }
            
            // Log for debugging
            log.debug("group", `Found ${groups.length} groups to export`);
        }
        
        if (groups.length === 0) {
            throw new Error("No valid groups found to export");
        }
        
        // Get all monitors associated with these groups
        const exportGroups = [];
        const timestamp = Math.floor(Date.now() / 1000); // Export timestamp
        
        for (const group of groups) {
            const groupId = group.id; // Store ID before deletion for reference
            
            // Create a copy to avoid modifying the original
            const exportGroup = { ...group, monitors: [] };
            
            // Remove sensitive/irrelevant fields
            delete exportGroup.id;
            delete exportGroup.user_id;
            
            // Get all monitors in this group
            const monitors = await R.find("monitor", " parent = ? AND user_id = ? AND type != ? ", [
                groupId,
                userID,
                "group"
            ]);
            
            log.debug("group", `Found ${monitors.length} monitors in group ${groupId}`);
            
            for (const monitor of monitors) {
                // Create a copy of the monitor to avoid modifying the original
                const exportMonitor = { ...monitor };
                
                // Remove sensitive/irrelevant fields
                delete exportMonitor.id;
                delete exportMonitor.user_id;
                delete exportMonitor.parent; // We'll restore this when importing
                
                exportGroup.monitors.push(exportMonitor);
            }
            
            exportGroups.push(exportGroup);
        }
        
        const result = {
            version: 1, // Export version for compatibility checks
            timestamp,
            application: "FoxTic", // Indicates this is a FoxTic export
            groups: exportGroups
        };
        
        log.debug("group", `Export complete: ${exportGroups.length} groups with monitors`);
        return result;
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
        
        try {
            // Check export version compatibility
            if (importData.version > 1) {
                throw new Error(`Unsupported export version: ${importData.version}`);
            }
            
            // Make version check more flexible - if version is missing, assume it's version 1
            if (!importData.version) {
                log.debug("group", "No version specified in import data, assuming version 1");
            }
            
            // Verify this is a FoxTic export or Uptime Kuma export (for compatibility)
            const validApplications = ["FoxTic", "Uptime Kuma"];
            if (importData.application && !validApplications.includes(importData.application)) {
                throw new Error(`Invalid import file: This file was exported from ${importData.application} which is not supported`);
            }
            
            // More flexible validation - if application is missing, attempt import anyway
            if (!importData.application) {
                log.debug("group", "No application specified in import data, attempting import anyway");
            }
            
            // Check if groups exist in import data
            if (!importData.groups || !Array.isArray(importData.groups) || importData.groups.length === 0) {
                throw new Error("No groups found in import data");
            }
            
            log.debug("group", `Found ${importData.groups.length} groups in import data`);
            
            // Import each group
            for (const exportedGroup of importData.groups) {
                if (!exportedGroup || typeof exportedGroup !== 'object') {
                    log.warn("group", "Skipping invalid group in import data");
                    continue;
                }
                
                // Ensure group has a name
                if (!exportedGroup.name) {
                    exportedGroup.name = "Imported Group " + Date.now();
                    log.debug("group", "Group without name detected, using generated name");
                }
                
                // Check if group already exists
                let existingGroup = await R.findOne("monitor", " name = ? AND user_id = ? AND type = ? ", [
                    exportedGroup.name,
                    userID,
                    "group"
                ]);
                
                let groupID;
                
                if (existingGroup) {
                    // Use existing group
                    log.debug("group", `Group '${exportedGroup.name}' already exists, using existing group`);
                    groupID = existingGroup.id;
                } else {
                    // Create the group
                    const group = R.dispense("monitor");
                    
                    // Set the group properties
                    group.name = exportedGroup.name;
                    group.type = "group";
                    group.user_id = userID;
                    group.active = 1;
                    group.active_monitoring = exportedGroup.active_monitoring || 0;
                    
                    // Save the group to get its ID
                    groupID = await R.store(group);
                    groupCount++;
                    
                    log.debug("group", `Created new group '${exportedGroup.name}' with ID ${groupID}`);
                }
                
                // Import the group's monitors
                if (exportedGroup.monitors && Array.isArray(exportedGroup.monitors)) {
                    log.debug("group", `Importing ${exportedGroup.monitors.length} monitors for group '${exportedGroup.name}'`);
                    
                    for (const exportedMonitor of exportedGroup.monitors) {
                        if (!exportedMonitor || typeof exportedMonitor !== 'object') {
                            log.warn("group", "Skipping invalid monitor in import data");
                            continue;
                        }
                        
                        // Ensure monitor has a name
                        if (!exportedMonitor.name) {
                            exportedMonitor.name = "Imported Monitor " + Date.now();
                            log.debug("group", "Monitor without name detected, using generated name");
                        }
                        
                        // Check if monitor already exists in group
                        const existingMonitor = await R.findOne("monitor", " name = ? AND user_id = ? AND parent = ? ", [
                            exportedMonitor.name,
                            userID,
                            groupID
                        ]);
                        
                        if (existingMonitor) {
                            log.debug("group", `Monitor '${exportedMonitor.name}' already exists in group, skipping`);
                            continue;
                        }
                        
                        const monitor = R.dispense("monitor");
                        
                        // Copy all properties from the exported monitor
                        for (const key in exportedMonitor) {
                            if (key !== 'id' && key !== 'user_id' && key !== 'parent') {
                                monitor[key] = exportedMonitor[key];
                            }
                        }
                        
                        // Ensure this is a FoxTic monitor
                        monitor.foxtic_managed = 1;
                        
                        // Set the required fields
                        monitor.user_id = userID;
                        monitor.parent = groupID;
                        monitor.active = 1; // Set active by default
                        
                        await R.store(monitor);
                        monitorCount++;
                        
                        log.debug("group", `Added monitor '${exportedMonitor.name}' to group`);
                    }
                }
            }
            
            log.debug("group", `Import complete: ${groupCount} groups with ${monitorCount} monitors`);
            
            return {
                groupCount,
                monitorCount
            };
        } catch (error) {
            log.error("group", "Import error: " + (error ? error.message : "Unknown error"));
            log.debug("group", "Import data: " + JSON.stringify(importData).substring(0, 200) + "...");
            throw error;
        }
    }
};