<template>
    <div>
        <h1 class="mb-3">{{ $t("Notification Sound Library") }}</h1>
        
        <!-- Configuration principale -->
        <div class="my-4">
            <div class="card">
                <div class="card-header">
                    <h5 class="card-title">{{ $t("Current Sound Settings") }}</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="downSound" class="form-label">{{ $t("Sound for Monitor Down") }}</label>
                            <select id="downSound" v-model="settings.downSound" class="form-select">
                                <option value="">{{ $t("No Sound") }}</option>
                                <option v-for="sound in availableSounds" :key="sound.id" :value="sound.id">
                                    {{ sound.name }}
                                </option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="upSound" class="form-label">{{ $t("Sound for Monitor Up") }}</label>
                            <select id="upSound" v-model="settings.upSound" class="form-select">
                                <option value="">{{ $t("No Sound") }}</option>
                                <option v-for="sound in availableSounds" :key="sound.id" :value="sound.id">
                                    {{ sound.name }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="volume" class="form-label">{{ $t("Volume") }}</label>
                            <input 
                                id="volume"
                                v-model="settings.volume" 
                                type="range" 
                                min="0" 
                                max="100" 
                                class="form-range"
                            >
                            <div class="text-muted small">{{ settings.volume }}%</div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check mt-4">
                                <input 
                                    id="soundEnabled"
                                    v-model="settings.enabled" 
                                    class="form-check-input" 
                                    type="checkbox"
                                >
                                <label class="form-check-label" for="soundEnabled">
                                    {{ $t("Enable Notification Sounds") }}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bibliothèque de sons -->
        <div class="my-4">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title">{{ $t("Available Sounds") }}</h5>
                    <button @click="showUploadModal = true" class="btn btn-primary">
                        <i class="fas fa-plus"></i> {{ $t("Add Custom Sound") }}
                    </button>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div v-for="sound in availableSounds" :key="sound.id" class="col-lg-4 col-md-6 mb-3">
                            <div class="card sound-card h-100">
                                <div class="card-body text-center">
                                    <div class="sound-icon mb-2">
                                        <i class="fas fa-volume-up fa-2x text-primary"></i>
                                    </div>
                                    <h6 class="card-title">{{ sound.name }}</h6>
                                    <p class="card-text text-muted small">{{ sound.description }}</p>
                                    <div class="btn-group-vertical w-100">
                                        <button @click="testSound(sound)" class="btn btn-outline-primary btn-sm">
                                            <i class="fas fa-play"></i> {{ $t("Play") }}
                                        </button>
                                        <button 
                                            v-if="sound.custom" 
                                            @click="deleteCustomSound(sound)" 
                                            class="btn btn-outline-danger btn-sm mt-1"
                                        >
                                            <i class="fas fa-trash"></i> {{ $t("Delete") }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal d'upload -->
        <div v-if="showUploadModal" class="modal d-block" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ $t("Upload Custom Sound") }}</h5>
                        <button @click="closeUploadModal" type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="soundName" class="form-label">{{ $t("Sound Name") }}</label>
                            <input 
                                id="soundName"
                                v-model="uploadForm.name" 
                                type="text" 
                                class="form-control" 
                                :placeholder="$t('Enter sound name')"
                            >
                        </div>
                        <div class="mb-3">
                            <label for="soundDescription" class="form-label">{{ $t("Description") }}</label>
                            <input 
                                id="soundDescription"
                                v-model="uploadForm.description" 
                                type="text" 
                                class="form-control"
                                :placeholder="$t('Enter description')"
                            >
                        </div>
                        <div class="mb-3">
                            <label for="audioFile" class="form-label">{{ $t("Audio File") }}</label>
                            <input 
                                id="audioFile"
                                @change="handleFileUpload" 
                                type="file" 
                                accept="audio/*" 
                                class="form-control"
                            >
                            <div class="form-text">{{ $t("Supported formats: MP3, WAV, OGG") }}</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="closeUploadModal" type="button" class="btn btn-secondary">
                            {{ $t("Cancel") }}
                        </button>
                        <button @click="uploadCustomSound" type="button" class="btn btn-primary" :disabled="!canUpload">
                            {{ $t("Upload") }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="showUploadModal" class="modal-backdrop fade show"></div>
    </div>
</template>

<script>
import soundManager from "../SoundManager.js";

/**
 * NotificationSounds - Interface de configuration des sons de notification
 * 
 * Fonctionnalités principales:
 * - Configuration sons pour moniteurs UP/DOWN
 * - Contrôle volume et activation/désactivation
 * - Bibliothèque de 5 sons intégrés
 * - Upload et gestion de sons personnalisés
 * - Test en temps réel des sons
 * 
 * Stockage: localStorage pour paramètres et sons personnalisés
 * Integration: soundManager pour lecture automatique
 */
export default {
    name: "NotificationSounds",
    data() {
        return {
            // Paramètres principaux avec valeurs par défaut
            settings: {
                enabled: true,
                downSound: "alert",
                upSound: "success",
                volume: 70
            },
            // Sons disponibles: prédéfinis + personnalisés
            availableSounds: [
                {
                    id: "alert",
                    name: "Alerte",
                    description: "Son d'alerte par défaut",
                    file: "/sounds/alert.mp3",
                    custom: false
                },
                {
                    id: "beep",
                    name: "Bip", 
                    description: "Son de bip simple",
                    generated: true,
                    custom: false
                },
                {
                    id: "chime",
                    name: "Carillon",
                    description: "Son de carillon agréable", 
                    generated: true,
                    custom: false
                },
                {
                    id: "success",
                    name: "Succès",
                    description: "Notification de succès",
                    generated: true,
                    custom: false
                },
                {
                    id: "warning",
                    name: "Avertissement",
                    description: "Notification d'avertissement",
                    generated: true,
                    custom: false
                }
            ],
            // État interface upload
            showUploadModal: false,
            uploadForm: {
                name: "",
                description: "",
                file: null
            }
        };
    },
    computed: {
        canUpload() {
            return this.uploadForm.name.trim() && this.uploadForm.file;
        }
    },
    mounted() {
        this.loadSettings();
        this.loadCustomSounds();
    },
    methods: {
        /** Charge les paramètres depuis soundManager */
        loadSettings() {
            this.settings = { ...this.settings, ...soundManager.settings };
        },
        
        /** Sauvegarde via soundManager */
        saveSettings() {
            soundManager.updateSettings(this.settings);
        },
        
        /** Charge sons personnalisés depuis localStorage et les ajoute à la liste */
        loadCustomSounds() {
            const customSounds = JSON.parse(localStorage.getItem("foxtic-custom-sounds") || "[]");
            this.availableSounds = this.availableSounds.filter(s => !s.custom);
            this.availableSounds.push(...customSounds);
        },
        
        /** Sauvegarde uniquement les sons personnalisés dans localStorage */
        saveCustomSounds() {
            const customSounds = this.availableSounds.filter(s => s.custom);
            localStorage.setItem("foxtic-custom-sounds", JSON.stringify(customSounds));
        },
        
        /** Test lecture d'un son (généré ou fichier) avec volume actuel */
        async testSound(sound) {
            if (sound.generated) {
                const audioGenerator = await import('../../utils/audioGenerator.js');
                await audioGenerator.default.playGeneratedSound(sound.id);
            } else if (sound.file) {
                const audio = new Audio(sound.file);
                audio.volume = this.settings.volume / 100;
                audio.play().catch(console.error);
            }
        },
        
        /** Validation et stockage du fichier audio sélectionné */
        handleFileUpload(event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith('audio/')) {
                this.uploadForm.file = file;
            } else {
                this.$toast.error("Veuillez sélectionner un fichier audio valide");
            }
        },
        
        /** Upload et ajout d'un son personnalisé à la bibliothèque */
        async uploadCustomSound() {
            if (!this.canUpload) return;
            
            try {
                const dataUrl = await this.fileToDataUrl(this.uploadForm.file);
                
                const newSound = {
                    id: `custom_${Date.now()}`,
                    name: this.uploadForm.name.trim(),
                    description: this.uploadForm.description.trim(),
                    file: dataUrl,
                    custom: true
                };
                
                this.availableSounds.push(newSound);
                this.saveCustomSounds();
                
                this.closeUploadModal();
                this.$toast.success(this.$t("Sound uploaded successfully"));
            } catch (error) {
                console.error("Erreur d'upload:", error);
                this.$toast.error(this.$t("Failed to upload sound"));
            }
        },
        
        /** Conversion fichier vers Data URL pour stockage localStorage */
        fileToDataUrl(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },
        
        /** Suppression d'un son personnalisé avec mise à jour des paramètres */
        deleteCustomSound(sound) {
            if (!sound.custom) return;
            
            if (confirm(this.$t("Are you sure you want to delete this sound?"))) {
                const index = this.availableSounds.findIndex(s => s.id === sound.id);
                if (index > -1) {
                    this.availableSounds.splice(index, 1);
                    this.saveCustomSounds();
                    
                    // Réinitialiser si ce son était configuré
                    if (this.settings.downSound === sound.id) {
                        this.settings.downSound = "";
                    }
                    if (this.settings.upSound === sound.id) {
                        this.settings.upSound = "";
                    }
                    this.saveSettings();
                }
            }
        },
        
        /** Fermeture modal et reset formulaire */
        closeUploadModal() {
            this.showUploadModal = false;
            this.uploadForm = { name: "", description: "", file: null };
        }
    },
    watch: {
        settings: {
            handler() {
                this.saveSettings();
            },
            deep: true
        }
    }
};
</script>

<style scoped>
.sound-card {
    transition: transform 0.2s ease-in-out;
    border: 1px solid #dee2e6;
}

.sound-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.sound-icon {
    opacity: 0.7;
}

.modal {
    background-color: rgba(0, 0, 0, 0.5);
}

.btn-group-vertical .btn {
    border-radius: 0.375rem !important;
}
</style>