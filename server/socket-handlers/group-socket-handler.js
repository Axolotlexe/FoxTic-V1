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
                throw new Error("Invalid import data format - expected array of groups");
            }
            
            log.debug("group", "Importing groups using simplified format");
            
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
        
        if (groupIDs.length > 0) {
            groups = await R.find("monitor", " id IN (?) AND user_id = ? AND type = ? ", [
                groupIDs, 
                userID,
                "group"
            ]);
            
            log.debug("group", `Found ${groups.length} groups to export`);
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
            
            log.debug("group", `Found ${monitors.length} monitors in group ${groupId}`);
            
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
        
        log.debug("group", `Export complete: ${exportResult.length} groups with monitors`);
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
            
            log.debug("group", `Found ${importData.length} groups in import data`);
            
            // Import each group using simplified format
            for (const groupData of importData) {
                if (!groupData || typeof groupData !== 'object') {
                    log.warn("group", "Skipping invalid group in import data");
                    continue;
                }
                
                // Validate group format in simplified structure
                if (!groupData.group || typeof groupData.group !== 'string') {
                    log.warn("group", "Group missing 'group' property or not a string, skipping");
                    continue;
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
                    log.debug("group", `Group '${groupName}' already exists, using existing group`);
                    groupID = existingGroup.id;
                } else {
                    // Create the group
                    const group = R.dispense("monitor");
                    
                    // Set the group properties
                    group.name = groupName;
                    group.type = "group";
                    group.user_id = userID;
                    group.active = 1;
                    group.active_monitoring = 0;
                    
                    // Save the group to get its ID
                    groupID = await R.store(group);
                    groupCount++;
                    
                    log.debug("group", `Created new group '${groupName}' with ID ${groupID}`);
                }
                
                // Import the group's monitors
                if (groupData.monitors && Array.isArray(groupData.monitors)) {
                    log.debug("group", `Importing ${groupData.monitors.length} monitors for group '${groupName}'`);
                    
                    for (const monitorData of groupData.monitors) {
                        if (!monitorData || typeof monitorData !== 'object') {
                            log.warn("group", "Skipping invalid monitor in import data");
                            continue;
                        }
                        
                        // Ensure monitor has a name
                        if (!monitorData.name) {
                            monitorData.name = "Imported Monitor " + Date.now();
                            log.debug("group", "Monitor without name detected, using generated name");
                        }
                        
                        // Check if monitor already exists in group
                        const existingMonitor = await R.findOne("monitor", " name = ? AND user_id = ? AND parent = ? ", [
                            monitorData.name,
                            userID,
                            groupID
                        ]);
                        
                        if (existingMonitor) {
                            log.debug("group", `Monitor '${monitorData.name}' already exists in group, skipping`);
                            continue;
                        }
                        
                        const monitor = R.dispense("monitor");
                        
                        // Copy all properties from the monitor data
                        for (const key in monitorData) {
                            if (key !== 'id' && key !== 'user_id' && key !== 'parent') {
                                monitor[key] = monitorData[key];
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
                        
                        log.debug("group", `Added monitor '${monitorData.name}' to group`);
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