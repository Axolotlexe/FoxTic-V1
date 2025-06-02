<template>
    <div class="notification-sound-library">
        <h4 class="mb-3">{{ $t("Notification Sound Library") }}</h4>
        
        <!-- Current Sound Settings -->
        <div class="card mb-4">
            <div class="card-header">
                <h5>{{ $t("Current Sound Settings") }}</h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <label class="form-label">{{ $t("Sound for Monitor Down") }}</label>
                        <select v-model="settings.downSound" class="form-select">
                            <option value="">{{ $t("No Sound") }}</option>
                            <option v-for="sound in availableSounds" :key="sound.id" :value="sound.id">
                                {{ sound.name }}
                            </option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">{{ $t("Sound for Monitor Up") }}</label>
                        <select v-model="settings.upSound" class="form-select">
                            <option value="">{{ $t("No Sound") }}</option>
                            <option v-for="sound in availableSounds" :key="sound.id" :value="sound.id">
                                {{ sound.name }}
                            </option>
                        </select>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-md-6">
                        <label class="form-label">{{ $t("Volume") }}</label>
                        <input 
                            v-model="settings.volume" 
                            type="range" 
                            min="0" 
                            max="100" 
                            class="form-range"
                        >
                        <small class="text-muted">{{ settings.volume }}%</small>
                    </div>
                    <div class="col-md-6">
                        <div class="form-check mt-4">
                            <input 
                                v-model="settings.enabled" 
                                class="form-check-input" 
                                type="checkbox" 
                                id="soundEnabled"
                            >
                            <label class="form-check-label" for="soundEnabled">
                                {{ $t("Enable Notification Sounds") }}
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sound Library -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5>{{ $t("Available Sounds") }}</h5>
                <button @click="showUploadModal = true" class="btn btn-primary btn-sm">
                    <i class="fas fa-plus"></i> {{ $t("Add Custom Sound") }}
                </button>
            </div>
            <div class="card-body">
                <div class="row">
                    <div v-for="sound in availableSounds" :key="sound.id" class="col-md-4 mb-3">
                        <div class="sound-item card h-100">
                            <div class="card-body text-center">
                                <h6>{{ sound.name }}</h6>
                                <p class="text-muted small">{{ sound.description }}</p>
                                <div class="btn-group" role="group">
                                    <button @click="playSound(sound)" class="btn btn-outline-primary btn-sm">
                                        <i class="fas fa-play"></i> {{ $t("Play") }}
                                    </button>
                                    <button 
                                        v-if="sound.custom" 
                                        @click="deleteSound(sound)" 
                                        class="btn btn-outline-danger btn-sm"
                                    >
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Upload Modal -->
        <div v-if="showUploadModal" class="modal d-block" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ $t("Upload Custom Sound") }}</h5>
                        <button @click="showUploadModal = false" type="button" class="btn-close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">{{ $t("Sound Name") }}</label>
                            <input v-model="uploadForm.name" type="text" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">{{ $t("Description") }}</label>
                            <input v-model="uploadForm.description" type="text" class="form-control">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">{{ $t("Audio File") }}</label>
                            <input @change="handleFileUpload" type="file" accept="audio/*" class="form-control">
                            <small class="text-muted">{{ $t("Supported formats: MP3, WAV, OGG") }}</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button @click="showUploadModal = false" type="button" class="btn btn-secondary">
                            {{ $t("Cancel") }}
                        </button>
                        <button @click="uploadSound" type="button" class="btn btn-primary" :disabled="!canUpload">
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
export default {
    name: "NotificationSoundLibrary",
    data() {
        return {
            settings: {
                enabled: true,
                downSound: "alert",
                upSound: "success",
                volume: 70
            },
            availableSounds: [
                {
                    id: "alert",
                    name: "Alert",
                    description: "Default alert sound",
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
            showUploadModal: false,
            uploadForm: {
                name: "",
                description: "",
                file: null
            },
            audioContext: null
        };
    },
    computed: {
        canUpload() {
            return this.uploadForm.name && this.uploadForm.file;
        }
    },
    mounted() {
        this.loadSettings();
        this.loadCustomSounds();
        this.initAudioContext();
    },
    methods: {
        loadSettings() {
            const saved = localStorage.getItem("foxtic-sound-settings");
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        },
        
        saveSettings() {
            localStorage.setItem("foxtic-sound-settings", JSON.stringify(this.settings));
            this.$emit("settings-updated", this.settings);
        },
        
        loadCustomSounds() {
            const saved = localStorage.getItem("foxtic-custom-sounds");
            if (saved) {
                const customSounds = JSON.parse(saved);
                this.availableSounds.push(...customSounds);
            }
        },
        
        saveCustomSounds() {
            const customSounds = this.availableSounds.filter(s => s.custom);
            localStorage.setItem("foxtic-custom-sounds", JSON.stringify(customSounds));
        },
        
        initAudioContext() {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("Audio context not supported");
            }
        },
        
        async playSound(sound) {
            if (!this.settings.enabled) return;
            
            if (sound.generated) {
                // Utiliser le générateur audio pour les sons générés
                const audioGenerator = await import('../utils/audioGenerator.js');
                await audioGenerator.default.playGeneratedSound(sound.id);
            } else if (sound.file) {
                // Utiliser un fichier audio
                const audio = new Audio(sound.file);
                audio.volume = this.settings.volume / 100;
                audio.play().catch(console.error);
            }
        },
        
        handleFileUpload(event) {
            const file = event.target.files[0];
            if (file) {
                this.uploadForm.file = file;
            }
        },
        
        async uploadSound() {
            if (!this.canUpload) return;
            
            try {
                // Create a data URL for the uploaded file
                const dataUrl = await this.fileToDataUrl(this.uploadForm.file);
                
                const newSound = {
                    id: `custom_${Date.now()}`,
                    name: this.uploadForm.name,
                    description: this.uploadForm.description,
                    file: dataUrl,
                    custom: true
                };
                
                this.availableSounds.push(newSound);
                this.saveCustomSounds();
                
                // Reset form
                this.uploadForm = { name: "", description: "", file: null };
                this.showUploadModal = false;
                
                this.$toast.success(this.$t("Sound uploaded successfully"));
            } catch (error) {
                this.$toast.error(this.$t("Failed to upload sound"));
                console.error("Upload error:", error);
            }
        },
        
        fileToDataUrl(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },
        
        deleteSound(sound) {
            if (!sound.custom) return;
            
            if (confirm(this.$t("Are you sure you want to delete this sound?"))) {
                const index = this.availableSounds.findIndex(s => s.id === sound.id);
                if (index > -1) {
                    this.availableSounds.splice(index, 1);
                    this.saveCustomSounds();
                    
                    // Update settings if this sound was selected
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
        
        // Public method to play notification sound
        playNotificationSound(type) {
            if (!this.settings.enabled) return;
            
            const soundId = type === "down" ? this.settings.downSound : this.settings.upSound;
            if (soundId) {
                const sound = this.availableSounds.find(s => s.id === soundId);
                if (sound) {
                    this.playSound(sound);
                }
            }
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
.notification-sound-library {
    padding: 20px;
}

.sound-item {
    transition: transform 0.2s;
}

.sound-item:hover {
    transform: translateY(-2px);
}

.modal {
    background-color: rgba(0, 0, 0, 0.5);
}

.btn-group .btn {
    margin: 0 2px;
}
</style>