# Guide de Maintenance - Bibliothèque de Sons de Notification

## Modifications Courantes

### Ajouter un Nouveau Son Généré

**Étapes requises:**

1. **AudioGenerator** (`src/utils/audioGenerator.js`)
   ```javascript
   // Ajouter nouvelle méthode de génération
   generateNewSound() {
       // Logique de génération avec Web Audio API
   }
   
   // Mettre à jour le switch dans playGeneratedSound()
   case 'newsound':
       this.generateNewSound();
       break;
   ```

2. **SoundManager** (`src/components/SoundManager.js`)
   ```javascript
   // Ajouter à la liste des sons générés
   isGeneratedSound(soundId) {
       const generatedSounds = ["beep", "chime", "success", "warning", "newsound"];
       return generatedSounds.includes(soundId);
   }
   ```

3. **NotificationSounds** (`src/components/settings/NotificationSounds.vue`)
   ```javascript
   // Ajouter à availableSounds dans data()
   {
       id: "newsound",
       name: "Nouveau Son",
       description: "Description du nouveau son",
       generated: true,
       custom: false
   }
   ```

4. **Traductions**
   - Ajouter clés si nécessaire dans `src/lang/en.json` et `src/lang/fr-FR.json`

### Modifier les Paramètres par Défaut

**Fichier:** `src/components/SoundManager.js`

```javascript
loadSettings() {
    const defaultSettings = {
        enabled: true,           // Activer/désactiver
        downSound: "alert",      // Son moniteur hors ligne
        upSound: "success",      // Son moniteur en ligne  
        volume: 70               // Volume par défaut
    };
}
```

### Ajouter un Nouveau Format Audio

**Validation côté client** (`NotificationSounds.vue`)
```javascript
handleFileUpload(event) {
    const file = event.target.files[0];
    // Ajouter nouveaux types MIME acceptés
    const validTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/nouveau'];
    if (file && validTypes.includes(file.type)) {
        this.uploadForm.file = file;
    }
}
```

### Changer la Logique de Déclenchement

**Fichier:** `src/pages/DashboardHome.vue`

```javascript
handleWebSocketMessage(data) {
    // Modifier conditions de déclenchement
    if (heartbeat && heartbeat.status !== undefined) {
        const status = heartbeat.status === 1 ? "up" : "down";
        
        // Ajouter conditions supplémentaires ici
        if (shouldPlaySound(monitor, heartbeat)) {
            soundManager.playNotificationSound(status);
        }
    }
}
```

## Dépannage

### Sons ne Fonctionnent Pas

**Vérifications:**
1. Paramètres activés: `soundManager.isEnabled()`
2. Volume > 0: `soundManager.settings.volume`
3. Contexte audio autorisé: interaction utilisateur requise
4. Console browser: erreurs de lecture audio

**Solutions:**
```javascript
// Forcer reprise contexte audio
if (audioContext.state === 'suspended') {
    await audioContext.resume();
}
```

### Sons Personnalisés Perdus

**Cause:** Nettoyage localStorage ou changement navigateur
**Solution:** Les sons sont stockés en Data URL, backup recommandé

### Performance Dégradée

**Optimisations:**
- Lazy loading AudioGenerator: `import()` dynamique
- Limitation taille fichiers personnalisés
- Debounce pour événements rapides

## Structure de Données

### localStorage Keys
```javascript
// Paramètres utilisateur
"foxtic-sound-settings": {
    enabled: boolean,
    downSound: string,
    upSound: string,
    volume: number
}

// Sons personnalisés
"foxtic-custom-sounds": [{
    id: string,
    name: string,
    description: string,
    file: dataURL,
    custom: true
}]
```

### Types de Sons
- **generated**: Créés via Web Audio API
- **file**: Fichiers MP3 prédéfinis
- **custom**: Uploadés par utilisateur

## Tests de Validation

### Tests Manuels Required
1. Upload fichier MP3/WAV/OGG
2. Test lecture chaque type son
3. Modification volume en temps réel
4. Suppression son personnalisé
5. Changement langue FR/EN
6. Redémarrage navigateur (persistence)

### Points de Contrôle
- Aucune erreur console
- Sons audibles selon volume
- Interface responsive
- Traductions correctes
- Sauvegarde automatique paramètres

## Sécurité

### Limitations Implémentées
- Validation types MIME côté client
- Stockage local uniquement (pas serveur)
- Pas d'exécution code externe
- Limitation taille par localStorage

### Bonnes Pratiques
- Validation avant lecture audio
- Gestion erreurs silencieuse
- Pas d'interruption interface
- Respect autorisations navigateur