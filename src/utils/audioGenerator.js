/**
 * Générateur de sons audio pour FoxTic
 * Crée des sons de notification programmatiquement
 */

class AudioGenerator {
    constructor() {
        this.audioContext = null;
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Contexte audio non supporté");
        }
    }

    // Génère un son de bip simple
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

    // Génère un carillon (notes multiples)
    generateChime() {
        if (!this.audioContext) return;

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        const startTime = this.audioContext.currentTime;

        notes.forEach((frequency, index) => {
            setTimeout(() => {
                this.generateBeep(frequency, 0.4);
            }, index * 200);
        });
    }

    // Génère un son de succès (montant)
    generateSuccess() {
        if (!this.audioContext) return;

        const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.generateBeep(freq, 0.2);
            }, index * 100);
        });
    }

    // Génère un son d'avertissement (oscillant)
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

    // Joue un son généré
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