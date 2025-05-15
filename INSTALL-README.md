# FoxTic - Installation Guide

FoxTic est un système de surveillance robuste qui vous permet de suivre la disponibilité et les performances de vos serveurs, sites web et services.

## Installation automatique (Recommandée)

Le moyen le plus simple d'installer FoxTic est d'utiliser notre script d'installation automatique. Ce script installera Node.js, configurera FoxTic et créera un service systemd.

### Prérequis

- Un système Linux basé sur Debian/Ubuntu
- Droits d'administrateur (sudo)
- Une connexion Internet

### Installation en une ligne

Vous pouvez installer FoxTic avec cette commande simple:

```bash
curl -fsSL https://get.foxtic.example.com | sudo bash
```

Ou si vous avez déjà téléchargé le projet:

```bash
sudo ./install.sh
```

Le script effectuera les opérations suivantes:
1. Installer Node.js 22.x
2. Créer un utilisateur dédié pour le service FoxTic
3. Installer FoxTic dans `/opt/foxtic`
4. Configurer un service systemd
5. Démarrer le service FoxTic

### Accès à FoxTic

Une fois l'installation terminée, vous pourrez accéder à FoxTic à l'adresse:
```
http://votre-serveur:3001
```

### Gestion du service

Vous pouvez gérer le service FoxTic avec les commandes systemd standard:

```bash
# Vérifier l'état du service
sudo systemctl status foxtic

# Démarrer le service
sudo systemctl start foxtic

# Arrêter le service
sudo systemctl stop foxtic

# Redémarrer le service
sudo systemctl restart foxtic

# Afficher les logs
sudo journalctl -u foxtic -f
```

## Installation manuelle

Si vous préférez une installation manuelle ou si vous utilisez un système non pris en charge par le script d'installation, vous pouvez suivre ces étapes:

1. Installer Node.js 22.x
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs
```

2. Cloner le dépôt FoxTic
```bash
git clone https://github.com/votre-utilisateur/foxtic.git
cd foxtic
```

3. Installer les dépendances
```bash
npm install --production
```

4. Démarrer FoxTic
```bash
node server/server.js
```

## Configuration

Le fichier de configuration principal se trouve à `/etc/foxtic/foxtic.env` après une installation automatique. Vous pouvez modifier ce fichier pour ajuster le port, activer le mode débogage et d'autres options.

## Mise à jour

Pour mettre à jour FoxTic, utilisez notre système de mise à jour intégré:

1. Dans l'interface web, accédez à "Paramètres" > "À propos"
2. Cliquez sur "Vérifier les mises à jour"
3. Suivez les instructions pour mettre à jour

Notre système A/B de mise à jour permet de basculer automatiquement entre deux canaux en cas de problème avec l'un des canaux.

## Support

Si vous rencontrez des problèmes avec l'installation, veuillez consulter notre documentation ou ouvrir un ticket sur GitHub.