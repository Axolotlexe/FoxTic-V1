<template>
    <div class="form-container" data-cy="setup-form">
        <div class="form">
            <form @submit.prevent="submit">
                <div class="logo-container">
                    <img src="/icon.svg" alt="FoxTic Logo" class="login-logo">
                </div>
                <h1 class="h3 mb-4 fw-normal login-title">FoxTic</h1>

                <p class="setup-title">
                    {{ $t("Create your admin account") }}
                </p>

                <div class="form-floating mt-3">
                    <select id="language" v-model="$root.language" class="form-select">
                        <option v-for="(lang, i) in $i18n.availableLocales" :key="`Lang${i}`" :value="lang">
                            {{ $i18n.messages[lang].languageName }}
                        </option>
                    </select>
                    <label for="language" class="form-label">{{ $t("Language") }}</label>
                </div>

                <div class="form-floating mt-3">
                    <input id="floatingInput" v-model="username" type="text" class="form-control" :placeholder="$t('Username')" required data-cy="username-input">
                    <label for="floatingInput">{{ $t("Username") }}</label>
                </div>

                <div class="form-floating mt-3">
                    <input id="floatingPassword" v-model="password" type="password" class="form-control" :placeholder="$t('Password')" required data-cy="password-input">
                    <label for="floatingPassword">{{ $t("Password") }}</label>
                </div>

                <div class="form-floating mt-3">
                    <input id="repeat" v-model="repeatPassword" type="password" class="form-control" :placeholder="$t('Repeat Password')" required data-cy="password-repeat-input">
                    <label for="repeat">{{ $t("Repeat Password") }}</label>
                </div>

                <button class="setup-btn w-100 btn btn-primary mt-4" type="submit" :disabled="processing" data-cy="submit-setup-form">
                    {{ $t("Create") }}
                </button>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            processing: false,
            username: "",
            password: "",
            repeatPassword: "",
        };
    },
    watch: {

    },
    mounted() {
        // TODO: Check if it is a database setup

        this.$root.getSocket().emit("needSetup", (needSetup) => {
            if (! needSetup) {
                this.$router.push("/");
            }
        });
    },
    methods: {
        /**
         * Submit form data for processing
         * @returns {void}
         */
        submit() {
            this.processing = true;

            if (this.password !== this.repeatPassword) {
                this.$root.toastError("PasswordsDoNotMatch");
                this.processing = false;
                return;
            }

            this.$root.getSocket().emit("setup", this.username, this.password, (res) => {
                this.processing = false;
                this.$root.toastRes(res);

                if (res.ok) {
                    this.processing = true;

                    this.$root.login(this.username, this.password, "", () => {
                        this.processing = false;
                        this.$router.push("/");
                    });
                }
            });
        },
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
    max-width: 380px;
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

.form-floating {
    width: 100%;
    max-width: 100%;
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

.setup-title {
    font-size: 1.15rem;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.7);
    margin-bottom: 15px;
    position: relative;
    display: inline-block;
    letter-spacing: 0.01em;
    
    .dark & {
        color: rgba(255, 255, 255, 0.8);
    }
    
    &::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 2px;
        background: rgba(59, 130, 246, 0.7);
        border-radius: 2px;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
    }
}

.setup-btn {
    width: 100%;
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
