<template>
    <div class="notfound-container" :class="{ 'dark': $root.darkTheme }">
        <!-- Desktop header -->
        <header v-if="! $root.isMobile" class="d-flex flex-wrap justify-content-center py-3 mb-3 border-bottom floating-header">
            <router-link to="/" class="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-decoration-none">
                <img src="/icon.svg" alt="FoxTic Logo" class="bi me-2 ms-4" width="40" height="40" />
                <span class="fs-4 title" :class="{ 'text-white': $root.darkTheme, 'text-dark': !$root.darkTheme }">{{ $t("FoxTic") }}</span>
            </router-link>
        </header>

        <!-- Mobile header -->
        <header v-else class="d-flex flex-wrap justify-content-center pt-2 pb-2 mb-3 floating-header-mobile">
            <router-link to="/dashboard" class="d-flex align-items-center text-decoration-none">
                <img src="/icon.svg" alt="FoxTic Logo" class="bi" width="40" height="40" />
                <span class="fs-4 title ms-2" :class="{ 'text-white': $root.darkTheme, 'text-dark': !$root.darkTheme }">FoxTic</span>
            </router-link>
        </header>

        <div class="content">
            <div class="error-container">
                <div class="error-code">404</div>
                <div class="error-title">
                    <i class="bi bi-exclamation-triangle-fill"></i> {{ $t("Page Not Found") }}
                </div>
                
                <div class="error-divider"></div>
                
                <div class="guide">
                    <h4>{{ $t("Most likely causes:") }}</h4>
                    <ul>
                        <li>{{ $t("The resource is no longer available.") }}</li>
                        <li>{{ $t("There might be a typing error in the address.") }}</li>
                    </ul>

                    <h4>{{ $t("What you can try:") }}</h4>
                    <ul>
                        <li>{{ $t("Retype the address.") }}</li>
                        <li><button class="btn-link" @click="goBack()">{{ $t("Go back to the previous page") }}</button></li>
                        <li><router-link to="/dashboard" class="router-link">{{ $t("Go back to dashboard") }}</router-link></li>
                    </ul>
                </div>
                
                <div class="action-buttons">
                    <button class="btn btn-primary" @click="goBack()">
                        <i class="bi bi-arrow-left"></i> {{ $t("Go Back") }}
                    </button>
                    <router-link to="/dashboard" class="btn btn-success">
                        <i class="bi bi-house-door"></i> {{ $t("Dashboard") }}
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            bodyClass: document.body.className
        };
    },
    async mounted() {
        // Make sure we apply the class to the component on mount
        this.updateThemeClass();
        
        // Listen for theme changes
        document.addEventListener('themeChange', this.updateThemeClass);
    },
    beforeUnmount() {
        // Clean up event listener
        document.removeEventListener('themeChange', this.updateThemeClass);
    },
    methods: {
        /**
         * Go back 1 in browser history
         * @returns {void}
         */
        goBack() {
            history.back();
        },
        
        /**
         * Update theme class based on body class
         * @returns {void}
         */
        updateThemeClass() {
            this.bodyClass = document.body.className;
        }
    }
};
</script>

<style scoped lang="scss">
@import "../assets/vars.scss";

.notfound-container {
    min-height: 100vh;
    background-color: #f8f9fa;
    
    .dark & {
        background-color: $dark-bg;
    }
}

.floating-header {
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 1000;
    background-color: white;
    border-radius: 10px;
    box-shadow: none;
    margin-bottom: 0;
    padding: 10px;

    .dark & {
        background-color: $dark-header-bg;
    }
}

.floating-header-mobile {
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    z-index: 1000;
    background-color: white;
    border-radius: 10px;
    box-shadow: none;
    
    .dark & {
        background-color: $dark-header-bg;
    }
}

.content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 90vh;
    padding: 20px;
}

.error-container {
    max-width: 800px;
    background-color: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    padding: 30px;
    text-align: center;
    margin-top: 60px;
    
    .dark & {
        background-color: $dark-header-bg;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
}

.error-code {
    font-size: 8rem;
    font-weight: bold;
    color: $success;
    line-height: 1;
    margin-bottom: 0;
    
    .dark & {
        color: $success;
    }
}

.error-title {
    font-size: 1.8rem;
    margin-bottom: 20px;
    color: #333;
    
    .dark & {
        color: #f0f6fc;
    }
}

.error-divider {
    height: 4px;
    width: 60px;
    background-color: $success;
    margin: 20px auto;
    border-radius: 2px;
}

.guide {
    text-align: left;
    max-width: 600px;
    margin: 0 auto 30px;
    color: #333;
    
    .dark & {
        color: #f0f6fc;
    }
    
    h4 {
        color: $success;
        margin-top: 20px;
        margin-bottom: 10px;
        font-size: 1.2rem;
    }
    
    ul {
        margin-bottom: 20px;
        
        li {
            margin-bottom: 8px;
        }
    }
}

.btn-link {
    background: none;
    border: none;
    color: $success;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    
    &:hover {
        color: darken($success, 10%);
    }
}

.router-link {
    color: $success;
    text-decoration: none;
    
    &:hover {
        text-decoration: underline;
    }
}

.action-buttons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 30px;
    
    .btn {
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 500;
    }
}

@media (max-width: 768px) {
    .error-container {
        padding: 20px;
        margin-top: 80px;
    }
    
    .error-code {
        font-size: 6rem;
    }
    
    .error-title {
        font-size: 1.5rem;
    }
    
    .action-buttons {
        flex-direction: column;
        
        .btn {
            width: 100%;
        }
    }
}

.title {
    font-weight: bold;
}
</style>
