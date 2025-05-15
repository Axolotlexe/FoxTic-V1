# Changelog des modifications FoxTic

## Rebranding et simplification des fonctionnalités

### Rebranding
- Renommé UptimeKuma en FoxTic dans l'ensemble du projet
- Renommé UptimeCalculator en FoxticUptimeCalculator
- Changé les messages de logs de "uptime-calc" à "foxtic-calc"
- Mis à jour les références dans les fichiers de configuration

### Système de mise à jour A/B
- Implémenté un système de versions A/B pour les mises à jour
- Ajouté la possibilité de basculer entre les canaux A et B
- Implémenté un mécanisme de bascule automatique en cas d'échec d'un canal
- Ajouté l'interface utilisateur pour la gestion des canaux de mise à jour

### Suppression des fonctionnalités non essentielles
- Retiré les options Docker Hosts du menu et désactivé les fonctionnalités correspondantes
- Retiré les options Remote Browsers du menu et désactivé les fonctionnalités correspondantes
- Retiré les options API Keys du menu et désactivé les fonctionnalités correspondantes
- Retiré les options Tags du menu et désactivé les fonctionnalités correspondantes
- Retiré les options Reverse Proxy du menu et désactivé les fonctionnalités correspondantes

### Commandes Git pour pousser les modifications
```bash
# Ajouter tous les fichiers modifiés
git add .

# Committer les changements
git commit -m "Rebranding vers FoxTic et implémentation du système A/B pour les mises à jour"

# Pousser vers GitHub (remplacer 'main' par le nom de votre branche si différent)
git push origin main
```

## Détail des fichiers modifiés
- `server/check-version.js`: Implémentation du système A/B pour les mises à jour
- `server/client.js`: Suppression des références aux fonctionnalités retirées
- `server/server.js`: Désactivation des handlers de socket correspondants
- `src/components/settings/About.vue`: Mise à jour de l'interface utilisateur pour les mises à jour A/B
- `src/pages/Settings.vue`: Suppression des entrées de menu pour les fonctionnalités retirées