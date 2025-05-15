# Instructions pour pousser FoxTic sur GitHub

Ce document contient les instructions détaillées pour pousser les modifications de FoxTic sur GitHub et configurer le système de mise à jour A/B.

## 1. Préparation

Avant de pousser sur GitHub, assurez-vous que toutes les modifications ont été testées et fonctionnent correctement.

## 2. Créer un dépôt GitHub

Si ce n'est pas déjà fait, créez un nouveau dépôt sur GitHub pour FoxTic.

## 3. Configuration du système de mise à jour A/B

Le système de mise à jour A/B nécessite un serveur qui héberge le fichier `version.json`. Vous pouvez utiliser GitHub Pages pour cela:

1. Dans les paramètres de votre dépôt GitHub, activez GitHub Pages
2. Configurez-le pour utiliser la branche `gh-pages` ou un dossier `/docs` sur votre branche principale
3. Poussez le contenu du dossier `github-pages` vers l'emplacement configuré

Une fois que GitHub Pages est configuré, notez l'URL et mettez à jour la constante `UPDATE_CHECKER_LATEST_VERSION_URL` dans le fichier `server/check-version.js` pour pointer vers cette URL.

## 4. Pousser les modifications

```bash
# Si vous n'avez pas encore configuré Git
git init
git config user.name "Votre Nom"
git config user.email "votre.email@exemple.com"

# Ajouter le dépôt distant
git remote add origin https://github.com/votre-utilisateur/foxtic.git

# Ajouter les fichiers modifiés
git add .

# Créer un commit
git commit -m "Rebranding vers FoxTic et implémentation du système A/B pour les mises à jour"

# Pousser vers GitHub
git push -u origin main  # Ou le nom de votre branche
```

## 5. Créer une release

Une fois que les modifications sont poussées, créez une nouvelle release sur GitHub:

1. Allez dans l'onglet "Releases" de votre dépôt
2. Cliquez sur "Create a new release"
3. Entrez le numéro de version (par exemple "1.0.0-beta.1")
4. Ajoutez une description des modifications
5. Publiez la release

## 6. Mises à jour futures

Pour les futures mises à jour:

1. Modifiez le fichier `github-pages/version.json` avec les nouvelles versions
2. Poussez les modifications vers GitHub
3. Les utilisateurs de FoxTic recevront une notification de mise à jour

## Remarques importantes

- Le système de mise à jour A/B permet aux utilisateurs de choisir entre deux canaux de mise à jour
- Si un canal est défaillant, FoxTic peut automatiquement basculer vers l'autre canal si l'option est activée
- Assurez-vous de tester chaque version avant de la publier sur le canal A (stable)