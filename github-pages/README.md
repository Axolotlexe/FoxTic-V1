# FoxTic Update Server

Ce dossier contient les fichiers nécessaires pour le système de mise à jour A/B de FoxTic.

## Configuration

1. Hébergez ces fichiers sur GitHub Pages ou un autre service d'hébergement statique.
2. Assurez-vous que le fichier `version.json` est accessible via HTTP/HTTPS.
3. Mettez à jour l'URL dans `server/check-version.js` pour pointer vers l'emplacement où vous hébergez ce fichier.

## Structure du fichier version.json

```json
{
  "versionA": "1.0.0-beta.1",  // Version du canal A
  "versionB": "1.0.0-alpha.9", // Version du canal B
  "beta": "1.0.1-beta.1"       // Version bêta (optionnelle)
}
```

## Gestion des versions

Pour mettre à jour FoxTic:

1. Mettez à jour le fichier `version.json` avec les nouvelles versions
2. Les utilisateurs recevront une notification de mise à jour dans leur interface FoxTic
3. Si un utilisateur a activé la bascule automatique, FoxTic basculera automatiquement vers le canal fonctionnel si l'un des canaux est défaillant