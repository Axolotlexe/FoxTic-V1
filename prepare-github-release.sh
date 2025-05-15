#!/bin/bash

# Script pour préparer une release pour GitHub

echo "Préparation d'une release FoxTic pour GitHub..."

# 1. Construction de la version de production
echo "Construction de la version de production..."
npm run build

# 2. Création du fichier de version A/B pour le serveur de mise à jour
echo "Création du fichier de version A/B..."
cat > ./version-foxtic.json << EOL
{
  "versionA": "1.0.0-beta.1",
  "versionB": "1.0.0-alpha.9",
  "beta": "1.0.1-beta.1"
}
EOL

echo "Le fichier version-foxtic.json a été créé. Il devra être hébergé à l'URL configurée dans check-version.js"

# 3. Instructions pour pousser sur GitHub
echo ""
echo "Pour pousser ces modifications sur GitHub, exécutez les commandes suivantes:"
echo "git add ."
echo "git commit -m \"Rebranding vers FoxTic et implémentation du système A/B pour les mises à jour\""
echo "git push origin [votre-branche]"
echo ""
echo "N'oubliez pas d'héberger le fichier version-foxtic.json sur votre serveur pour que le système de mise à jour A/B fonctionne correctement."

echo "Préparation terminée!"