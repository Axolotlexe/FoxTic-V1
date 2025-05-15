<template>
    <div class="form-container">
        <div class="form">
            <form @submit.prevent="submit">
                <div class="logo-container">
                    <img src="/icon.svg" alt="FoxTic Logo" class="login-logo">
                </div>
                <h1 class="h3 mb-4 fw-normal login-title">FoxTic</h1>

                <div v-if="!tokenRequired" class="form-floating">
                    <input id="floatingInput" v-model="username" type="text" class="form-control" placeholder="Username" autocomplete="username" required>
                    <label for="floatingInput">{{ $t("Username") }}</label>
                </div>

                <div v-if="!tokenRequired" class="form-floating mt-3">
                    <input id="floatingPassword" v-model="password" type="password" class="form-control" placeholder="Password" autocomplete="current-password" required>
                    <label for="floatingPassword">{{ $t("Password") }}</label>
                </div>

                <div v-if="tokenRequired">
                    <div class="form-floating mt-3">
                        <input id="otp" v-model="token" type="text" maxlength="6" class="form-control" placeholder="123456" autocomplete="one-time-code" required>
                        <label for="otp">{{ $t("Token") }}</label>
                    </div>
                </div>

                <div class="form-check mb-3 mt-3 d-flex justify-content-center pe-4">
                    <div class="form-check">
                        <input id="remember" v-model="$root.remember" type="checkbox" value="remember-me" class="form-check-input">

                        <label class="form-check-label" for="remember">
                            {{ $t("Remember me") }}
                        </label>
                    </div>
                </div>
                <button class="w-100 btn btn-primary login-btn" type="submit" :disabled="processing">
                    {{ $t("Login") }}
                </button>

                <div v-if="res && !res.ok" class="alert alert-danger mt-3 login-error" role="alert">
                    {{ $t(res.msg) }}
                </div>
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
            token: "",
            res: null,
            tokenRequired: false,
        };
    },

    mounted() {
        document.title += " - Login";
    },

    unmounted() {
        document.title = document.title.replace(" - Login", "");
    },

    methods: {
        /**
         * Submit the user details and attempt to log in
         * @returns {void}
         */
        submit() {
            this.processing = true;

            this.$root.login(this.username, this.password, this.token, (res) => {
                this.processing = false;

                if (res.tokenRequired) {
                    this.tokenRequired = true;
                } else {
                    this.res = res;
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

.form-floating {
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
        border-radius: 10px; /* Bordures arrondies comme navbar */
        transition: all 0.25s ease-in-out;
        border: 1px solid rgba(255, 255, 255, 0.4);
        background-color: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        box-shadow: none;
        
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
            box-shadow: none;
            border-color: rgba(59, 130, 246, 0.5);
            background-color: rgba(255, 255, 255, 0.7);
        }
    }
}

.form {
    width: 100%;
    max-width: 340px;
    padding: 32px;
    margin: auto;
    text-align: center;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: none;
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
        box-shadow: none;

        &::before {
            background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.2), transparent 70%);
        }

        &::after {
            background: radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.1), transparent 70%);
        }
    }
}

.login-btn {
    border-radius: 10px; /* Bordures arrondies comme navbar */
    padding: 12px;
    margin-top: 20px;
    font-weight: 600;
    transition: all 0.3s ease-in-out;
    background: rgba(59, 130, 246, 0.9);
    border: none;
    color: #fff;
    box-shadow: none;
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
        box-shadow: none;
        background: rgba(59, 130, 246, 1);
        
        &::before {
            transform: translateX(100%);
        }
    }
    
    &:active:not(:disabled) {
        transform: translateY(0);
        background: rgba(37, 99, 235, 0.9); /* Bleu plus foncé que 3B82F6 */
        box-shadow: none;
    }
    
    &:disabled {
        background-color: rgba(59, 130, 246, 0.5);
        box-shadow: none;
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

.login-logo {
    width: 80px;
    height: 80px;
    filter: none;
    margin-bottom: 5px;
    transition: transform 0.3s ease;
    
    .dark & {
        filter: none;
    }
    
    &:hover {
        transform: scale(1.05);
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

.login-error {
    border-radius: 10px; /* Bordures arrondies comme navbar */
    text-align: center;
    background-color: rgba(253, 232, 232, 0.8);
    border: none;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
}

.login-title {
    font-weight: 700;
    font-size: 1.5rem;
    color: rgba(0, 0, 0, 0.8);
    margin-bottom: 25px;
    position: relative;
    display: inline-block;
    letter-spacing: 0.01em;
    text-shadow: none;
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
        box-shadow: none;
    }
    
    .dark & {
        background: linear-gradient(135deg, #fff, #b1b8c0);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: none;
    }
}
</style>
