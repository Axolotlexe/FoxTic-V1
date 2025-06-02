/**
 * Gestionnaire de sons pour les notifications FoxTic
 */
class SoundManager {
    constructor() {
        this.settings = this.loadSettings();
        this.audioContext = null;
        this.initAudioContext();
    }

    loadSettings() {
        const defaultSettings = {
            enabled: true,
            downSound: "alert",
            upSound: "success", 
            volume: 70
        };
        
        const saved = localStorage.getItem("foxtic-sound-settings");
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    saveSettings() {
        localStorage.setItem("foxtic-sound-settings", JSON.stringify(this.settings));
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Contexte audio non supporté");
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    isEnabled() {
        return this.settings.enabled;
    }

    async playNotificationSound(monitorStatus) {
        if (!this.settings.enabled) return;

        const soundId = monitorStatus === "down" ? this.settings.downSound : this.settings.upSound;
        if (!soundId) return;

        if (this.isGeneratedSound(soundId)) {
            const audioGenerator = await import('../utils/audioGenerator.js');
            await audioGenerator.default.playGeneratedSound(soundId);
        } else {
            const soundFile = this.getSoundFile(soundId);
            if (soundFile) {
                await this.playSound(soundFile);
            }
        }
    }

    getSoundFile(soundId) {
        const soundMap = {
            "alert": "/sounds/alert.mp3"
        };

        return soundMap[soundId] || this.getCustomSoundFile(soundId);
    }

    isGeneratedSound(soundId) {
        const generatedSounds = ["beep", "chime", "success", "warning"];
        return generatedSounds.includes(soundId);
    }

    getCustomSoundFile(soundId) {
        const customSounds = JSON.parse(localStorage.getItem("foxtic-custom-sounds") || "[]");
        const sound = customSounds.find(s => s.id === soundId);
        return sound ? sound.file : null;
    }

    async playSound(soundFile) {
        try {
            // Reprendre le contexte audio si nécessaire
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const audio = new Audio(soundFile);
            audio.volume = this.settings.volume / 100;
            
            return new Promise((resolve, reject) => {
                audio.onended = resolve;
                audio.onerror = reject;
                audio.play().catch(reject);
            });
        } catch (error) {
            console.error("Erreur lors de la lecture du son:", error);
        }
    }

    testSound(soundId) {
        const soundFile = this.getSoundFile(soundId);
        if (soundFile) {
            this.playSound(soundFile);
        }
    }
}

// Instance singleton
const soundManager = new SoundManager();

export default soundManager;