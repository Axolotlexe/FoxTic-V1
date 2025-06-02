# Guide d'Intégration - Bibliothèque de Sons de Notification

## Points d'Intégration dans FoxTic

### 1. WebSocket Integration (DashboardHome.vue)

**Déclenchement automatique lors des changements d'état:**
```javascript
// Localisation: src/pages/DashboardHome.vue:484
handleWebSocketMessage(data) {
    if (message.type === 'status_update') {
        if (message.data && message.data.monitor) {
            const heartbeat = message.data.heartbeat;
            if (heartbeat && heartbeat.status !== undefined) {
                const status = heartbeat.status === 1 ? "up" : "down";
                soundManager.playNotificationSound(status);
            }
        }
    }
}
```

**Utilisation:** Sons automatiques quand moniteur change d'état via WebSocket

### 2. Settings Menu Integration (Settings.vue)

**Ajout dans le menu de navigation:**
```javascript
// Localisation: src/pages/Settings.vue:95
subMenus() {
    return {
        // ... autres options
        "notification-sounds": {
            title: this.$t("Notification Sound Library"),
        },
    };
}
```

**Route correspondante:** `/settings/notification-sounds`

### 3. Router Configuration (router.js)

**Route complète:**
```javascript
// Localisation: src/router.js:166-172
{
    path: "notification-sounds",
    component: NotificationSounds,
}
```

**Import du composant:** `import NotificationSounds from "./components/settings/NotificationSounds.vue"`

## Architecture de Communication

### SoundManager ↔ Interface Utilisateur
```
NotificationSounds.vue
    ↓ updateSettings()
SoundManager.js
    ↓ saveSettings()
localStorage
```

### SoundManager ↔ Système de Monitoring
```
WebSocket Message
    ↓ handleWebSocketMessage()
DashboardHome.vue
    ↓ playNotificationSound()
SoundManager.js
    ↓ Sons automatiques
```

## Cycle de Vie des Sons

### 1. Initialisation
- SoundManager créé comme singleton
- Chargement paramètres depuis localStorage
- Initialisation contexte Web Audio API

### 2. Configuration Utilisateur
- Interface NotificationSounds.vue
- Sélection sons UP/DOWN
- Ajustement volume et activation
- Test sons en temps réel

### 3. Déclenchement Automatique
- Écoute messages WebSocket status_update
- Détection changement état moniteur
- Lecture son correspondant selon configuration

### 4. Gestion Sons Personnalisés
- Upload fichiers audio
- Conversion en Data URL
- Stockage localStorage
- Intégration liste sons disponibles

## Dépendances Externes

### Web Audio API
**Support navigateurs:** Chrome 36+, Firefox 25+, Safari 14.1+, Edge 79+
**Fallback:** Audio HTML5 pour fichiers MP3

### localStorage
**Capacité:** ~5-10MB selon navigateur
**Utilisation:** Paramètres + sons personnalisés en Data URL

### Vue.js Reactivity
**Watchers actifs:**
- settings → sauvegarde automatique
- availableSounds → mise à jour interface

## Points d'Extension

### Nouveaux Types de Notifications
```javascript
// Ajouter dans handleWebSocketMessage()
if (message.type === 'maintenance_alert') {
    soundManager.playNotificationSound("maintenance");
}
```

### Intégration Notifications Push
```javascript
// Exemple intégration service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'monitor_alert') {
            soundManager.playNotificationSound(event.data.status);
        }
    });
}
```

### API Externe pour Sons
```javascript
// Extension possible pour télécharger sons depuis API
async loadRemoteSounds() {
    const response = await fetch('/api/sound-library');
    const remoteSounds = await response.json();
    this.availableSounds.push(...remoteSounds);
}
```

## Performance et Optimisation

### Lazy Loading
- AudioGenerator importé dynamiquement: `import('../utils/audioGenerator.js')`
- Évite chargement initial si sons désactivés

### Memory Management
- Sons personnalisés stockés en Data URL (pas de leaks)
- Contexte audio réutilisé, pas recréé
- Nettoyage automatique événements lors destruction composants

### Réseau
- Sons générés: 0 requête réseau
- Sons prédéfinis: cache navigateur
- Sons personnalisés: stockage local

## Sécurité

### Validation Input
```javascript
// Validation types MIME stricte
if (file && file.type.startsWith('audio/')) {
    this.uploadForm.file = file;
}
```

### Isolation
- Pas d'accès serveur aux sons personnalisés
- Pas d'exécution code arbitraire
- Stockage bac à sable localStorage

### Permissions
- Contexte audio nécessite interaction utilisateur
- Respect autorisations navigateur
- Gestion gracieuse des refus