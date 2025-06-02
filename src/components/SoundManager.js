/**
 * SoundManager - Gestionnaire central des notifications sonores FoxTic
 * Gère la lecture automatique des sons lors des changements d'état des moniteurs
 * Stockage local des préférences utilisateur et support des sons personnalisés
 */
class SoundManager {
    constructor() {
        this.settings = this.loadSettings();
        this.audioContext = null;
        this.initAudioContext();
    }

    /** Charge les paramètres depuis localStorage avec valeurs par défaut */
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

    /** Sauvegarde les paramètres dans localStorage */
    saveSettings() {
        localStorage.setItem("foxtic-sound-settings", JSON.stringify(this.settings));
    }

    /** Initialise le contexte audio pour la génération de sons */
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Contexte audio non supporté");
        }
    }

    /** Met à jour et sauvegarde les nouveaux paramètres */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    /** Vérifie si les notifications sonores sont activées */
    isEnabled() {
        return this.settings.enabled;
    }

    /** 
     * Joue automatiquement le son approprié selon l'état du moniteur
     * @param {string} monitorStatus - "up" ou "down" 
     */
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

    /** Retourne le chemin du fichier pour les sons prédéfinis ou personnalisés */
    getSoundFile(soundId) {
        const soundMap = {
            "alert": "/sounds/alert.mp3"
        };

        return soundMap[soundId] || this.getCustomSoundFile(soundId);
    }

    /** Vérifie si le son est généré programmatiquement */
    isGeneratedSound(soundId) {
        const generatedSounds = ["beep", "chime", "success", "warning"];
        return generatedSounds.includes(soundId);
    }

    /** Récupère les sons personnalisés depuis localStorage */
    getCustomSoundFile(soundId) {
        const customSounds = JSON.parse(localStorage.getItem("foxtic-custom-sounds") || "[]");
        const sound = customSounds.find(s => s.id === soundId);
        return sound ? sound.file : null;
    }

    /** Joue un fichier audio avec gestion du volume et des erreurs */
    async playSound(soundFile) {
        try {
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

    /** Test d'un son spécifique pour l'interface utilisateur */
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