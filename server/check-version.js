const { setSetting, setting } = require("./util-server");
const axios = require("axios");
const compareVersions = require("compare-versions");
const { log } = require("../src/util");

exports.version = require("../package.json").version;
exports.latestVersion = null;
exports.latestVersionA = null;
exports.latestVersionB = null;
exports.activeUpdateChannel = 'A'; // Default to channel A

// How much time in ms to wait between update checks
const UPDATE_CHECKER_INTERVAL_MS = 1000 * 60 * 60 * 48;
const UPDATE_CHECKER_LATEST_VERSION_URL = "https://foxtic.example.com/version"; // Change to actual domain when available

let interval;

exports.startInterval = () => {
    let check = async () => {
        if (await setting("checkUpdate") === false) {
            return;
        }

        log.debug("update-checker", "Retrieving latest versions");

        try {
            const res = await axios.get(UPDATE_CHECKER_LATEST_VERSION_URL);

            // For debug
            if (process.env.TEST_CHECK_VERSION === "1") {
                res.data.versionA = "1000.0.0";
                res.data.versionB = "999.0.0";
            }

            let checkBeta = await setting("checkBeta");
            exports.activeUpdateChannel = await setting("updateChannel") || 'A';

            // Store both channel versions
            if (res.data.versionA) {
                exports.latestVersionA = res.data.versionA;
            }
            
            if (res.data.versionB) {
                exports.latestVersionB = res.data.versionB;
            }

            // Determine which version to use based on active channel
            if (exports.activeUpdateChannel === 'A' && exports.latestVersionA) {
                exports.latestVersion = exports.latestVersionA;
            } else if (exports.activeUpdateChannel === 'B' && exports.latestVersionB) {
                exports.latestVersion = exports.latestVersionB;
            }

            // Check beta version if enabled
            if (checkBeta && res.data.beta) {
                const compareWithCurrent = exports.latestVersion 
                    ? compareVersions.compare(res.data.beta, exports.latestVersion, ">")
                    : true;
                    
                if (compareWithCurrent) {
                    exports.latestVersion = res.data.beta;
                }
            }

            // Automatic fallback logic
            if (await setting("autoUpdateFallback") === true) {
                // If current channel update fails, switch to the other channel
                const currentVersionCheck = exports.activeUpdateChannel === 'A' 
                    ? exports.latestVersionA 
                    : exports.latestVersionB;
                
                if (!currentVersionCheck) {
                    // Current channel has no version, switch to the other channel
                    const newChannel = exports.activeUpdateChannel === 'A' ? 'B' : 'A';
                    const alternateVersion = newChannel === 'A' ? exports.latestVersionA : exports.latestVersionB;
                    
                    if (alternateVersion) {
                        log.info("update-checker", `Auto-switching to update channel ${newChannel} due to availability`);
                        await setSetting("updateChannel", newChannel);
                        exports.activeUpdateChannel = newChannel;
                        exports.latestVersion = alternateVersion;
                    }
                }
            }

        } catch (error) {
            log.info("update-checker", "Failed to check for new versions");
            log.debug("update-checker", error.toString());
            
            // On error, try to use the alternate channel if auto-fallback is enabled
            if (await setting("autoUpdateFallback") === true) {
                const newChannel = exports.activeUpdateChannel === 'A' ? 'B' : 'A';
                const alternateVersion = newChannel === 'A' ? exports.latestVersionA : exports.latestVersionB;
                
                if (alternateVersion) {
                    log.info("update-checker", `Auto-switching to update channel ${newChannel} due to error`);
                    await setSetting("updateChannel", newChannel);
                    exports.activeUpdateChannel = newChannel;
                    exports.latestVersion = alternateVersion;
                }
            }
        }
    };

    check();
    interval = setInterval(check, UPDATE_CHECKER_INTERVAL_MS);
};

/**
 * Enable the check update feature
 * @param {boolean} value Should the check update feature be enabled?
 * @returns {Promise<void>}
 */
exports.enableCheckUpdate = async (value) => {
    await setSetting("checkUpdate", value);

    clearInterval(interval);

    if (value) {
        exports.startInterval();
    }
};

/**
 * Set the update channel to use (A or B)
 * @param {string} channel The update channel to use ('A' or 'B')
 * @returns {Promise<void>}
 */
exports.setUpdateChannel = async (channel) => {
    if (channel !== 'A' && channel !== 'B') {
        throw new Error("Invalid update channel. Must be 'A' or 'B'");
    }
    
    await setSetting("updateChannel", channel);
    exports.activeUpdateChannel = channel;
    
    // Update the latest version based on the selected channel
    if (channel === 'A' && exports.latestVersionA) {
        exports.latestVersion = exports.latestVersionA;
    } else if (channel === 'B' && exports.latestVersionB) {
        exports.latestVersion = exports.latestVersionB;
    }
};

/**
 * Enable or disable automatic fallback between update channels
 * @param {boolean} value Should auto fallback be enabled?
 * @returns {Promise<void>}
 */
exports.enableAutoUpdateFallback = async (value) => {
    await setSetting("autoUpdateFallback", value);
};

/**
 * Get current update channel info
 * @returns {Object} Object containing update channel information
 */
exports.getUpdateChannelInfo = async () => {
    return {
        activeChannel: exports.activeUpdateChannel,
        channelA: {
            version: exports.latestVersionA || null,
        },
        channelB: {
            version: exports.latestVersionB || null,
        },
        autoFallback: await setting("autoUpdateFallback") || false
    };
};

exports.socket = null;
