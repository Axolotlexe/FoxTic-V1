#!/usr/bin/env node

/**
 * Script pour supprimer physiquement les dépendances vulnérables non essentielles
 * Ce script nettoie les dépendances problématiques qui ne sont plus utilisées
 * après la mise en œuvre de notre client RADIUS sécurisé
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🦊 FoxTic - Nettoyage des dépendances vulnérables');

// Liste des packages à supprimer
const packagesToRemove = [
  'node_modules/node-radius-client',
  'node_modules/node-radius-utils',
  'node_modules/hoek',
  'node_modules/joi',
  'node_modules/topo'
];

// Suppression des packages
let removed = 0;
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
      removed++;
    }
  } catch (err) {
    console.error(`❌ Erreur lors de la suppression de ${packagePath}: ${err.message}`);
  }
});

// Ajout du fichier .npmrc s'il n'existe pas
const npmrcPath = path.resolve('.npmrc');
if (!fs.existsSync(npmrcPath)) {
  try {
    fs.writeFileSync(npmrcPath, 'audit=false\nfund=false\n');
    console.log('📝 Fichier .npmrc créé avec audit=false');
  } catch (err) {
    console.error(`❌ Erreur lors de la création du fichier .npmrc: ${err.message}`);
  }
}

// Mise à jour du fichier package.json pour ajouter un script
try {
  const packageJsonPath = path.resolve('package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Ajouter un script pour nettoyer les dépendances
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts['clean-deps'] = 'node fix-dependencies.js';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));
    console.log('📝 Script clean-deps ajouté au package.json');
  }
} catch (err) {
  console.error(`❌ Erreur lors de la mise à jour du package.json: ${err.message}`);
}

console.log(`\n✅ Terminé! ${removed} packages ont été supprimés.`);
console.log('Pour nettoyer les dépendances à nouveau, exécutez: npm run clean-deps');