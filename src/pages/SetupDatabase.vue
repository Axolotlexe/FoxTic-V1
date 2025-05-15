<template>
    <div v-if="show" class="form-container">
        <div class="form">
            <form @submit.prevent="submit">
                <div class="logo-container">
                    <img src="/icon.svg" alt="Uptime Kuma Logo" class="login-logo">
                </div>
                <h1 class="h3 mb-4 fw-normal login-title">Uptime Kuma</h1>

                <div v-if="info.runningSetup" class="mt-5">
                    <div class="setup-progress-container">
                        <div class="setup-progress-message">
                            <div class="setup-icon-container">
                                <div class="setup-spinner"></div>
                            </div>
                            <div class="setup-text">
                                {{ $t("settingUpDatabaseMSG") }}
                            </div>
                        </div>
                    </div>
                </div>

                <template v-if="!info.runningSetup">
                    <div class="form-floating mt-3">
                        <select id="language" v-model="$root.language" class="form-select">
                            <option v-for="(lang, i) in $i18n.availableLocales" :key="`Lang${i}`" :value="lang">
                                {{ $i18n.messages[lang].languageName }}
                            </option>
                        </select>
                        <label for="language" class="form-label">{{ $t("Language") }}</label>
                    </div>

                    <p class="mt-4 db-choose-text">
                        {{ $t("setupDatabaseChooseDatabase") }}
                    </p>

                    <div class="db-btn-group" role="group" aria-label="Database selection">
                        <template v-if="info.isEnabledEmbeddedMariaDB">
                            <input id="btnradio3" v-model="dbConfig.type" type="radio" class="btn-check" autocomplete="off" value="embedded-mariadb">

                            <label class="btn btn-outline-primary db-option" for="btnradio3">
                                Embedded MariaDB
                            </label>
                        </template>

                        <input id="btnradio2" v-model="dbConfig.type" type="radio" class="btn-check" autocomplete="off" value="mariadb">
                        <label class="btn btn-outline-primary db-option" for="btnradio2">
                            MariaDB/MySQL
                        </label>

                        <input id="btnradio1" v-model="dbConfig.type" type="radio" class="btn-check" autocomplete="off" value="sqlite">
                        <label class="btn btn-outline-primary db-option" for="btnradio1">
                            SQLite
                        </label>
                    </div>

                    <div v-if="dbConfig.type === 'embedded-mariadb'" class="mt-3 db-description">
                        {{ $t("setupDatabaseEmbeddedMariaDB") }}
                    </div>

                    <div v-if="dbConfig.type === 'mariadb'" class="mt-3 db-description">
                        {{ $t("setupDatabaseMariaDB") }}
                    </div>

                    <div v-if="dbConfig.type === 'sqlite'" class="mt-3 db-description">
                        {{ $t("setupDatabaseSQLite") }}
                    </div>

                    <template v-if="dbConfig.type === 'mariadb'">
                        <div class="form-floating mt-3">
                            <input id="floatingInput" v-model="dbConfig.hostname" type="text" class="form-control" required>
                            <label for="floatingInput">{{ $t("Hostname") }}</label>
                        </div>

                        <div class="form-floating mt-3">
                            <input id="floatingInput" v-model="dbConfig.port" type="text" class="form-control" required>
                            <label for="floatingInput">{{ $t("Port") }}</label>
                        </div>

                        <div class="form-floating mt-3">
                            <input id="floatingInput" v-model="dbConfig.username" type="text" class="form-control" required>
                            <label for="floatingInput">{{ $t("Username") }}</label>
                        </div>

                        <div class="form-floating mt-3">
                            <input id="floatingInput" v-model="dbConfig.password" type="password" class="form-control" required>
                            <label for="floatingInput">{{ $t("Password") }}</label>
                        </div>

                        <div class="form-floating mt-3">
                            <input id="floatingInput" v-model="dbConfig.dbName" type="text" class="form-control" required>
                            <label for="floatingInput">{{ $t("dbName") }}</label>
                        </div>
                    </template>

                    <button class="btn btn-primary mt-4 setup-btn" type="submit" :disabled="disabledButton">
                        {{ $t("Next") }}
                    </button>
                </template>
            </form>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import { useToast } from "vue-toastification";
import { sleep } from "../util.ts";
const toast = useToast();

export default {
    data() {
        return {
            show: false,
            dbConfig: {
                type: undefined,
                port: 3306,
                hostname: "",
                username: "",
                password: "",
                dbName: "kuma",
            },
            info: {
                needSetup: false,
                runningSetup: false,
                isEnabledEmbeddedMariaDB: false,
            },
        };
    },
    computed: {
        disabledButton() {
            return this.dbConfig.type === undefined || this.info.runningSetup;
        },
    },
    async mounted() {
        let res = await axios.get("/setup-database-info");
        this.info = res.data;

        if (this.info && this.info.needSetup === false) {
            location.href = "/setup";
        } else {
            this.show = true;
        }
    },
    methods: {
        async submit() {
            this.info.runningSetup = true;

            try {
                await axios.post("/setup-database", {
                    dbConfig: this.dbConfig,
                });
                await sleep(2000);
                await this.goToMainServerWhenReady();
            } catch (e) {
                toast.error(e.response.data);
            } finally {
                this.info.runningSetup = false;
            }

        },

        async goToMainServerWhenReady() {
            try {
                console.log("Trying...");
                let res = await axios.get("/setup-database-info");
                if (res.data && res.data.needSetup === false) {
                    this.show = false;
                    location.href = "/setup";
                } else {
                    if (res.data) {
                        this.info = res.data;
                    }
                    throw new Error("not ready");
                }
            } catch (e) {
                console.log("Not ready yet");
                await sleep(2000);
                await this.goToMainServerWhenReady();
            }
        },

        test() {
            this.$root.toastError("not implemented");
        }
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.form-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - 80px); /* Ajustement pour tenir compte du header */
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center, rgba(59, 130, 246, 0.1), transparent 60%);
        transform: rotate(-15deg);
        z-index: -1;
    }
    
    &::after {
        content: '';
        position: absolute;
        bottom: -50%;
        left: -50%;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center, rgba(59, 130, 246, 0.07), transparent 60%);
        transform: rotate(15deg);
        z-index: -1;
    }
}

.form {
    width: 100%;
    max-width: 450px;
    padding: 32px;
    margin: auto;
    text-align: center;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.1),
        inset 0 0 0 1px rgba(255, 255, 255, 0.5);
    position: relative;
    z-index: 1;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        width: 140%;
        height: 140%;
        background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 70%);
        top: -20%;
        right: -20%;
        z-index: -1;
    }

    &::after {
        content: '';
        position: absolute;
        width: 140%;
        height: 140%;
        background: radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.1), transparent 70%);
        bottom: -20%;
        left: -20%;
        z-index: -1;
    }

    .dark & {
        background: rgba(22, 27, 34, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.05);
        box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05);

        &::before {
            background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 70%);
        }

        &::after {
            background: radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.1), transparent 70%);
        }
    }
}

form {
    text-align: center;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
}

.form-floating {
    width: 100%;
    max-width: 340px;
    margin-bottom: 15px;

    > .form-select {
        padding-left: 1.3rem;
        padding-top: 1.525rem;
        line-height: 1.35;
        border-radius: 10px;
        transition: all 0.25s ease-in-out;
        border: 1px solid rgba(255, 255, 255, 0.4);
        background-color: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

        ~ label {
            padding-left: 1.3rem;
        }
        
        .dark & {
            background-color: rgba(13, 17, 23, 0.4);
            border-color: rgba(255, 255, 255, 0.1);
            color: $dark-font-color;
            
            &:focus {
                background-color: rgba(13, 17, 23, 0.5);
                border-color: rgba(59, 130, 246, 0.6);
            }
        }
        
        &:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
            border-color: rgba(59, 130, 246, 0.5);
            background-color: rgba(255, 255, 255, 0.7);
        }
    }

    > label {
        padding-left: 1.3rem;
        color: rgba(0, 0, 0, 0.6);
        font-weight: 500;
        
        .dark & {
            color: rgba(255, 255, 255, 0.7);
        }
    }

    > .form-control {
        padding-left: 1.3rem;
        border-radius: 10px;
        transition: all 0.25s ease-in-out;
        border: 1px solid rgba(255, 255, 255, 0.4);
        background-color: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        
        .dark & {
            background-color: rgba(13, 17, 23, 0.4);
            border-color: rgba(255, 255, 255, 0.1);
            color: $dark-font-color;
            
            &:focus {
                background-color: rgba(13, 17, 23, 0.5);
                border-color: rgba(59, 130, 246, 0.6);
            }
        }
        
        &:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
            border-color: rgba(59, 130, 246, 0.5);
            background-color: rgba(255, 255, 255, 0.7);
        }
    }
}

.db-choose-text {
    margin-bottom: 20px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
    
    .dark & {
        color: rgba(255, 255, 255, 0.8);
    }
}

.db-description {
    max-width: 340px;
    margin: 15px auto;
    font-size: 0.9rem;
    padding: 12px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    
    .dark & {
        background: rgba(13, 17, 23, 0.4);
        border-color: rgba(255, 255, 255, 0.05);
        color: $dark-font-color;
    }
}

.db-btn-group {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 340px;
    gap: 10px;
    margin-bottom: 20px;
}

.db-option {
    border-radius: 10px !important;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    transition: all 0.25s ease-in-out;
    font-weight: 500;
    color: rgba(59, 130, 246, 0.9);
    
    &:hover {
        background: rgba(255, 255, 255, 0.7);
        border-color: rgba(59, 130, 246, 0.3);
        box-shadow: 0 3px 10px rgba(59, 130, 246, 0.1);
    }
    
    &.active {
        background: rgba(59, 130, 246, 0.9);
        color: #fff;
        border-color: rgba(59, 130, 246, 0.9);
        box-shadow: 0 3px 15px rgba(59, 130, 246, 0.2);
    }
    
    .dark & {
        background: rgba(22, 27, 34, 0.6);
        border-color: rgba(255, 255, 255, 0.1);
        color: rgba(59, 130, 246, 0.9);
        
        &:hover {
            background: rgba(22, 27, 34, 0.8);
            border-color: rgba(59, 130, 246, 0.3);
        }
        
        &.active {
            background: rgba(59, 130, 246, 0.9);
            color: #fff;
        }
    }
}

.setup-btn {
    width: 100%;
    max-width: 340px;
    border-radius: 10px;
    padding: 12px;
    margin-top: 20px;
    font-weight: 600;
    transition: all 0.3s ease-in-out;
    background: rgba(59, 130, 246, 0.9);
    border: none;
    color: #fff;
    box-shadow: 
        0 4px 15px rgba(59, 130, 246, 0.3),
        inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    letter-spacing: 0.03em;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
            to right,
            rgba(255, 255, 255, 0.1),
            rgba(255, 255, 255, 0.2)
        );
        transform: translateX(-100%);
        transition: transform 0.6s ease-in-out;
    }
    
    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 
            0 8px 20px rgba(59, 130, 246, 0.4),
            inset 0 0 0 1px rgba(255, 255, 255, 0.2);
        background: rgba(59, 130, 246, 1);
        
        &::before {
            transform: translateX(100%);
        }
    }
    
    &:active:not(:disabled) {
        transform: translateY(0);
        background: rgba(37, 99, 235, 0.9); /* Bleu plus foncé que 3B82F6 */
        box-shadow: 
            0 4px 10px rgba(59, 130, 246, 0.2),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    }
    
    &:disabled {
        background-color: rgba(59, 130, 246, 0.5);
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);
    }
}

.setup-progress-container {
    width: 100%;
    max-width: 340px;
    margin: 0 auto;
}

.setup-progress-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
    border-radius: 10px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 
        0 8px 20px rgba(0, 0, 0, 0.05),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(
            circle at top right,
            rgba(59, 130, 246, 0.2),
            transparent 70%
        );
        z-index: -1;
    }
    
    .dark & {
        background: rgba(30, 58, 138, 0.2);
        border-color: rgba(59, 130, 246, 0.3);
        box-shadow: 
            0 8px 20px rgba(0, 0, 0, 0.1),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }
}

.setup-icon-container {
    position: relative;
    width: 60px;
    height: 60px;
    margin-bottom: 16px;
    
    &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.15);
        animation: pulse-setup 2s ease-in-out infinite;
        z-index: -1;
    }
}

.setup-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid rgba(59, 130, 246, 0.3);
    border-top: 3px solid rgba(59, 130, 246, 0.8);
    border-radius: 50%;
    animation: spin 1.2s linear infinite;
    margin: 5px;
}

.setup-text {
    font-size: 1.1rem;
    font-weight: 500;
    color: rgba(30, 58, 138, 0.9);
    text-align: center;
    line-height: 1.5;
    margin-top: 8px;
    
    .dark & {
        color: rgba(219, 234, 254, 0.9);
    }
}

@keyframes pulse-setup {
    0% {
        transform: scale(1);
        opacity: 0.7;
    }
    50% {
        transform: scale(1.1);
        opacity: 0.5;
    }
    100% {
        transform: scale(1);
        opacity: 0.7;
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.login-logo {
    width: 80px;
    height: 80px;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.1));
    margin-bottom: 5px;
    transition: transform 0.3s ease;
    
    .dark & {
        filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
    }
    
    &:hover {
        transform: scale(1.05);
    }
}

.logo-container {
    margin-bottom: 15px;
    position: relative;
    
    &::after {
        content: '';
        position: absolute;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.15), transparent 70%);
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        z-index: -1;
        animation: pulse 3s ease-in-out infinite;
    }
}

@keyframes pulse {
    0% {
        opacity: 0.5;
        transform: translate(-50%, -50%) scale(0.8);
    }
    50% {
        opacity: 0.7;
        transform: translate(-50%, -50%) scale(1);
    }
    100% {
        opacity: 0.5;
        transform: translate(-50%, -50%) scale(0.8);
    }
}

.login-title {
    font-weight: 700;
    font-size: 1.5rem;
    color: rgba(0, 0, 0, 0.8);
    margin-bottom: 25px;
    position: relative;
    display: inline-block;
    letter-spacing: 0.01em;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
    background: linear-gradient(135deg, #333, #000);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    
    &::after {
        content: '';
        position: absolute;
        left: 50%;
        bottom: -8px;
        width: 30px;
        height: 2px;
        background: #3B82F6; /* Bleu explicite au lieu de $primary */
        transform: translateX(-50%);
        border-radius: 2px;
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
    }
    
    .dark & {
        background: linear-gradient(135deg, #fff, #b1b8c0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
    }
}
</style>
