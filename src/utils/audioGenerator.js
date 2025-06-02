/**
 * AudioGenerator - Générateur de sons de notification programmatiques
 * Utilise Web Audio API pour créer des sons sans fichiers audio
 * Types disponibles: beep, chime, success, warning
 */
class AudioGenerator {
    constructor() {
        this.audioContext = null;
        this.initAudioContext();
    }

    /** Initialise le contexte Web Audio API */
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Contexte audio non supporté");
        }
    }

    /** 
     * Génère un bip simple avec oscillateur sinusoïdal
     * @param {number} frequency - Fréquence en Hz (défaut: 800)
     * @param {number} duration - Durée en secondes (défaut: 0.3)
     */
    generateBeep(frequency = 800, duration = 0.3) {
        if (!this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        const startTime = this.audioContext.currentTime;
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        return { oscillator, gainNode };
    }

    /** Séquence de carillon harmonique (C5, E5, G5) */
    generateChime() {
        if (!this.audioContext) return;
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                this.generateBeep(frequency, 0.4);
            }, index * 200);
        });
    }

    /** Mélodie ascendante pour succès (A4, C#5, E5) */
    generateSuccess() {
        if (!this.audioContext) return;
        const frequencies = [440, 554.37, 659.25];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.generateBeep(freq, 0.2);
            }, index * 100);
        });
    }

    /** Alternance haute/basse pour avertissement */
    generateWarning() {
        if (!this.audioContext) return;
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.generateBeep(800, 0.2);
                setTimeout(() => {
                    this.generateBeep(600, 0.2);
                }, 150);
            }, i * 400);
        }
    }

    /** 
     * Joue le son demandé après reprise du contexte audio
     * @param {string} type - Type de son: beep, chime, success, warning
     */
    async playGeneratedSound(type) {
        if (!this.audioContext) return;

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        switch (type) {
            case 'beep':
                this.generateBeep();
                break;
            case 'chime':
                this.generateChime();
                break;
            case 'success':
                this.generateSuccess();
                break;
            case 'warning':
                this.generateWarning();
                break;
            default:
                this.generateBeep();
        }
    }
}

export default new AudioGenerator();