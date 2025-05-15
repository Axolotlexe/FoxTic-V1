<template>
    <div tabindex="-1" class="dropdown" @focusin="open = true" @focusout="handleFocusOut">
        <button type="button" class="filter-dropdown-status" :class="{ 'active': filterActive, 'responsive': true }" tabindex="0">
            <div class="px-1 d-flex align-items-center">
                <slot name="status"></slot>
            </div>
            <span class="px-1">
                <font-awesome-icon icon="angle-down" />
            </span>
        </button>
        <ul class="filter-dropdown-menu" :class="{ 'open': open }">
            <slot name="dropdown"></slot>
        </ul>
    </div>
</template>

<script>

export default {
    components: {

    },
    props: {
        filterActive: {
            type: Boolean,
            required: true,
        }
    },
    data() {
        return {
            open: false
        };
    },
    methods: {
        handleFocusOut(e) {
            if (e.relatedTarget != null && this.$el.contains(e.relatedTarget)) {
                return;
            }
            this.open = false;
        }
    }
};
</script>

<style lang="scss">
@import "../assets/vars.scss";
@import "../assets/app.scss";

.filter-dropdown-menu {
    z-index: 100;
    transition: all 0.2s;
    padding: 8px 0 !important;
    border-radius: 10px;
    overflow: hidden;

    position: absolute;
    inset: 0 auto auto 0;
    margin: 0;
    transform: translate(0, 36px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    visibility: hidden;
    list-style: none;
    height: 0;
    opacity: 0;
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.05);
    min-width: 180px;
    
    @media (max-width: 576px) {
        min-width: 160px;
        max-height: 300px;
        overflow-y: auto;
    }
    
    @media (max-width: 460px) {
        min-width: 140px;
        max-height: 250px;
    }

    &.open {
        height: unset;
        visibility: inherit;
        opacity: 1;
    }

    .dropdown-item {
        padding: 8px 15px;
        transition: all 0.15s ease;
        margin: 0 5px;
        border-radius: 6px;
        
        &:hover {
            background-color: #f5f5f5;
        }
    }

    .dropdown-item:focus {
        background: rgba($success, 0.08);
        outline: none;

        .dark & {
            background: $dark-bg2;
        }
    }

    .dark & {
        background-color: $dark-bg;
        color: $dark-font-color;
        border-color: $dark-border-color;

        .dropdown-item {
            color: $dark-font-color;

            &.active {
                color: $dark-font-color2;
                background-color: $highlight !important;
            }

            &:hover {
                background-color: $dark-bg2;
            }
        }
    }
}

.filter-dropdown-status {
    @extend .btn-outline-normal;
    display: flex;
    align-items: center;
    margin-left: 5px;
    color: #555;
    padding: 5px 12px;
    border-radius: 10px;
    border: 1px solid #e0e0e0;
    background-color: #fff;
    font-size: 0.85rem;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    white-space: nowrap;
    min-width: 90px; /* Assurez une largeur minimale pour éviter des boutons trop petits */
    justify-content: center;
    
    @media (max-width: 768px) {
        padding: 5px 10px;
        font-size: 0.8rem;
        margin-left: 3px;
        min-width: 80px;
    }
    
    @media (max-width: 576px) {
        padding: 5px 8px;
        margin-bottom: 5px;
        min-width: 75px;
        font-size: 0.78rem;
    }
    
    @media (max-width: 460px) {
        padding: 5px 6px;
        font-size: 0.75rem;
        margin-left: 2px;
        min-width: 70px;
    }
    
    &:hover {
        border-color: #ccc;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
    }

    .dark & {
        color: $dark-font-color;
        background-color: $dark-bg;
        border-color: $dark-border-color;
    }

    &:focus {
        background-color: $highlight-white;
        box-shadow: 0 0 0 3px rgba($success, 0.15);
        border-color: rgba($success, 0.5);

        .dark & {
            background-color: $dark-font-color2;
        }
    }

    &.active {
        border: 1px solid rgba($success, 0.5);
        background-color: rgba($success, 0.08);
        color: $success;

        .dark & {
            background-color: $dark-font-color2;
            color: $success;
        }
    }
}

.filter-active {
    color: $highlight;
}
</style>
