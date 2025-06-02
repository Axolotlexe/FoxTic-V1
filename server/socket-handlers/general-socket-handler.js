const { log } = require("../../src/util");
const { Settings } = require("../settings");
const { sendInfo } = require("../client");
const { checkLogin } = require("../util-server");
// Modules GameDig et real-browser supprimés pour optimisation FoxTic
const fs = require("fs");
const path = require("path");

// GameResolver supprimé pour optimisation FoxTic
let gameList = null;

/**
 * GameDig supprimé pour optimisation FoxTic
 */
function getGameList() {
    return []; // Liste vide car GameDig désactivé
}

/**
 * Handler for general events
 * @param {Socket} socket Socket.io instance
 * @param {FoxTicServer} server FoxTic server
 * @returns {void}
 */
module.exports.generalSocketHandler = (socket, server) => {
    socket.on("initServerTimezone", async (timezone) => {
        try {
            checkLogin(socket);
            log.debug("generalSocketHandler", "Timezone: " + timezone);
            await Settings.set("initServerTimezone", true);
            await server.setTimezone(timezone);
            await sendInfo(socket);
        } catch (e) {
            log.warn("initServerTimezone", e.message);
        }
    });

    socket.on("getGameList", async (callback) => {
        try {
            checkLogin(socket);
            callback({
                ok: true,
                gameList: getGameList(),
            });
        } catch (e) {
            callback({
                ok: false,
                msg: e.message,
            });
        }
    });

    socket.on("testChrome", (executable, callback) => {
        try {
            checkLogin(socket);
            // Just noticed that await call could block the whole socket.io server!!! Use pure promise instead.
            testChrome(executable).then((version) => {
                callback({
                    ok: true,
                    msg: {
                        key: "foundChromiumVersion",
                        values: [ version ],
                    },
                    msgi18n: true,
                });
            }).catch((e) => {
                callback({
                    ok: false,
                    msg: e.message,
                });
            });
        } catch (e) {
            callback({
                ok: false,
                msg: e.message,
            });
        }
    });

    socket.on("getPushExample", (language, callback) => {

        try {
            let dir = path.join("./extra/push-examples", language);
            let files = fs.readdirSync(dir);

            for (let file of files) {
                if (file.startsWith("index.")) {
                    callback({
                        ok: true,
                        code: fs.readFileSync(path.join(dir, file), "utf8"),
                    });
                    return;
                }
            }
        } catch (e) {

        }

        callback({
            ok: false,
            msg: "Not found",
        });
    });

    // Disconnect all other socket clients of the user
    socket.on("disconnectOtherSocketClients", async () => {
        try {
            checkLogin(socket);
            server.disconnectAllSocketClients(socket.userID, socket.id);
        } catch (e) {
            log.warn("disconnectAllSocketClients", e.message);
        }
    });
};
