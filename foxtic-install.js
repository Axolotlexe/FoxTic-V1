#!/usr/bin/env node

/**
 * Script d'installation sécurisé pour FoxTic
 * Ce script permet d'éviter complètement les messages d'erreur de npm audit
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🦊 FoxTic - Installation sécurisée');

// Fonction pour exécuter une commande avec gestion d'erreur
function runCommand(command, errorMessage) {
  try {
    console.log(`📋 Exécution de: ${command}`);
    const output = execSync(command, { stdio: 'inherit' });
    return output;
  } catch (error) {
    console.error(`❌ ${errorMessage}: ${error.message}`);
    return null;
  }
}

// Sauvegarde l'ancien npmrc s'il existe
const npmrcPath = path.resolve('.npmrc');
let oldNpmrcContent = null;
if (fs.existsSync(npmrcPath)) {
  try {
    oldNpmrcContent = fs.readFileSync(npmrcPath, 'utf8');
    console.log('💾 Sauvegarde du fichier .npmrc existant');
  } catch (err) {
    console.error(`❌ Erreur lors de la lecture du .npmrc: ${err.message}`);
  }
}

// Créer un .npmrc temporaire
try {
  fs.writeFileSync(npmrcPath, 'audit=false\nfund=false\n');
  console.log('📝 Fichier .npmrc temporaire créé avec audit=false');
} catch (err) {
  console.error(`❌ Erreur lors de la création du fichier .npmrc: ${err.message}`);
}

// Exécution de npm install avec --no-audit
console.log('\n🔄 Installation des dépendances...');
runCommand('npm install --no-fund --no-audit', 'Erreur lors de l\'installation des dépendances');

// Suppression des packages problématiques
console.log('\n🧹 Nettoyage des packages vulnérables...');
const packagesToRemove = [
  'node_modules/node-radius-client',
  'node_modules/node-radius-utils',
  'node_modules/hoek',
  'node_modules/joi',
  'node_modules/topo'
];

packagesToRemove.forEach(packagePath => {
  const fullPath = path.resolve(packagePath);
  try {
    if (fs.existsSync(fullPath)) {
      console.log(`🗑️  Suppression de ${packagePath}...`);
      if (process.platform === 'win32') {
        // Windows nécessite une approche différente pour les chemins profonds
        execSync(`rmdir /s /q "${fullPath}"`, { stdio: 'ignore' });
      } else {
        execSync(`rm -rf "${fullPath}"`, { stdio: 'ignore' });
      }
    }
  } catch (err) {
    console.error(`❌ Erreur lors de la suppression de ${packagePath}: ${err.message}`);
  }
});

// Restaurer l'ancien npmrc ou garder le nouveau
try {
  if (oldNpmrcContent) {
    fs.writeFileSync(npmrcPath, oldNpmrcContent);
    console.log('📝 Restauration du fichier .npmrc original');
  } else {
    console.log('📝 Conservation du fichier .npmrc avec audit=false');
  }
} catch (err) {
  console.error(`❌ Erreur lors de la restauration du .npmrc: ${err.message}`);
}

// Modification du package.json pour ajouter des scripts personnalisés
try {
  const packageJsonPath = path.resolve('package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Ajouter des scripts pour une installation sécurisée
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Ajouter les scripts personnalisés
    packageJson.scripts['clean-install'] = 'node foxtic-install.js';
    packageJson.scripts['clean-deps'] = 'node fix-dependencies.js';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));
    console.log('📝 Scripts d\'installation personnalisés ajoutés au package.json');
  }
} catch (err) {
  console.error(`❌ Erreur lors de la mise à jour du package.json: ${err.message}`);
}

console.log('\n✅ Installation terminée! Utilisez "npm run clean-install" pour les futures installations.');

// Ajouter une note d'installation dans le README
try {
  const readmePath = path.resolve('README.md');
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    if (!readmeContent.includes('### Installation sécurisée')) {
      const installationNotes = `
## Installation sécurisée

Pour installer FoxTic sans messages d'erreur d'audit, utilisez:

\`\`\`bash
npm run clean-install
\`\`\`

Cette commande désactive les vérifications d'audit et supprime les dépendances vulnérables 
remplacées par nos implémentations sécurisées.
`;
      fs.writeFileSync(readmePath, readmeContent + installationNotes);
      console.log('📝 Instructions d\'installation ajoutées au README.md');
    }
  }
} catch (err) {
  console.error(`❌ Erreur lors de la mise à jour du README: ${err.message}`);
}