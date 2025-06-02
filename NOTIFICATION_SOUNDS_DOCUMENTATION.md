# Documentation - Bibliothèque de Sons de Notification FoxTic

## Vue d'ensemble

La bibliothèque de sons de notification permet aux utilisateurs de personnaliser les alertes audio lors des changements d'état des moniteurs. Le système fonctionne automatiquement en arrière-plan et offre une interface de configuration complète.

## Architecture du Système

### Composants Principaux

1. **SoundManager** (`src/components/SoundManager.js`)
   - Gestionnaire central singleton
   - Stockage localStorage des préférences
   - Interface avec AudioGenerator et fichiers audio

2. **AudioGenerator** (`src/utils/audioGenerator.js`)
   - Génération programmatique de sons via Web Audio API
   - 4 types de sons intégrés sans fichiers externes

3. **NotificationSounds** (`src/components/settings/NotificationSounds.vue`)
   - Interface utilisateur de configuration
   - Gestion des sons personnalisés
   - Test en temps réel

4. **DashboardHome** (`src/pages/DashboardHome.vue`)
   - Intégration WebSocket pour déclenchement automatique
   - Écoute des changements d'état des moniteurs

## Types de Sons Disponibles

### Sons Intégrés (générés)
- **beep**: Bip simple 800Hz, 0.3s
- **chime**: Séquence harmonique C5-E5-G5
- **success**: Mélodie ascendante A4-C#5-E5
- **warning**: Alternance 800Hz/600Hz répétée 3x

### Sons Prédéfinis (fichiers)
- **alert**: Fichier MP3 par défaut (/sounds/alert.mp3)

### Sons Personnalisés
- Upload de fichiers MP3, WAV, OGG
- Stockage en Data URL dans localStorage
- Gestion complète (ajout, suppression, test)

## Configuration

### Paramètres Principaux
```javascript
{
  enabled: true,          // Activation globale
  downSound: "alert",     // Son pour moniteur hors ligne
  upSound: "success",     // Son pour moniteur en ligne  
  volume: 70              // Volume 0-100%
}
```

### Stockage LocalStorage
- `foxtic-sound-settings`: Paramètres utilisateur
- `foxtic-custom-sounds`: Sons personnalisés uploadés

## Intégration WebSocket

Le système écoute automatiquement les messages WebSocket de type `status_update`:

```javascript
// Dans DashboardHome.vue
if (heartbeat && heartbeat.status !== undefined) {
    const status = heartbeat.status === 1 ? "up" : "down";
    soundManager.playNotificationSound(status);
}
```

## Utilisation de l'Interface

### Accès
Paramètres → Bibliothèque de sons de notification

### Fonctionnalités
1. **Configuration**: Sélection sons UP/DOWN, volume, activation
2. **Test**: Bouton lecture pour chaque son disponible
3. **Upload**: Modal pour ajouter sons personnalisés
4. **Gestion**: Suppression sons personnalisés

## API du SoundManager

### Méthodes Principales
```javascript
// Lecture automatique selon statut
soundManager.playNotificationSound("up"|"down")

// Test d'un son spécifique
soundManager.testSound(soundId)

// Mise à jour des paramètres
soundManager.updateSettings(newSettings)

// Vérification activation
soundManager.isEnabled()
```

## Support Navigateurs

- **Web Audio API**: Chrome, Firefox, Safari, Edge modernes
- **Audio HTML5**: Fallback pour fichiers MP3/WAV
- **localStorage**: Stockage paramètres et sons personnalisés

## Gestion d'Erreurs

- Contexte audio suspendu → reprise automatique
- Fichiers audio invalides → validation côté client
- Erreurs de lecture → logs console, pas d'interruption

## Traductions

Système bilingue complet (français/anglais):
- Interface utilisateur traduite
- Messages d'erreur localisés
- Descriptions des sons

## Performances

- Sons générés: Instantanés, pas de chargement réseau
- Sons personnalisés: Data URL, chargement immédiat
- Singleton pattern: Une seule instance SoundManager
- Lazy loading: AudioGenerator importé à la demande

## Maintenance

### Ajout de Nouveaux Sons Générés
1. Ajouter méthode dans AudioGenerator
2. Mettre à jour switch playGeneratedSound()
3. Ajouter à isGeneratedSound() dans SoundManager
4. Ajouter à availableSounds dans NotificationSounds.vue

### Modification des Paramètres
Tous les changements passent par SoundManager.updateSettings() pour garantir la cohérence localStorage/interface.

## Sécurité

- Validation types MIME pour upload (audio/*)
- Stockage local uniquement (pas de serveur)
- Pas d'exécution de code externe
- Limitation taille fichiers par navigateur (localStorage)