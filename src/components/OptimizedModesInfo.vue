<template>
  <div class="card shadow-sm">
    <div class="card-body p-3">
      <h5 class="card-title">
        {{ $t("Mode Optimisé pour Grand Nombre de Sondes") }}
        <span class="badge bg-success">{{ $t("Actif") }}</span>
      </h5>
      
      <p class="card-text">
        {{ $t("FoxTic est configuré en mode haute performance pour supporter plus de 200 sondes simultanées sans erreurs SIGIL.") }}
      </p>
      
      <hr />
      
      <h6>{{ $t("Types de sondes disponibles") }}:</h6>
      <ul class="list-group list-group-flush mb-3">
        <li class="list-group-item px-0 fw-bold">HTTP(s) - {{ $t("Ping") }} <span class="badge bg-success">{{ $t("Recommandé") }}</span></li>
        <li class="list-group-item px-0">HTTP(s) - {{ $t("Status Code") }}</li>
        <li class="list-group-item px-0">HTTP(s) - {{ $t("Mot-clé") }}</li>
        <li class="list-group-item px-0">Ping</li>
        <li class="list-group-item px-0">TCP</li>
        <li class="list-group-item px-0">DNS</li>
        <li class="list-group-item px-0">{{ $t("Groupe") }}</li>
      </ul>
      
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        {{ $t("Pour maintenir des performances optimales avec un grand nombre de sondes, certaines fonctionnalités avancées ont été désactivées.") }}
      </div>
      
      <h6 class="mt-3">{{ $t("Types de sondes désactivés") }}:</h6>
      <div class="row">
        <div class="col-md-6">
          <ul class="list-group list-group-flush mb-3">
            <li class="list-group-item px-0">HTTP(s) - {{ $t("Requête JSON") }}</li>
            <li class="list-group-item px-0">HTTP(s) - {{ $t("Browser Engine") }}</li>
            <li class="list-group-item px-0">gRPC(s) - {{ $t("Mot-clé") }}</li>
            <li class="list-group-item px-0">Docker Container</li>
            <li class="list-group-item px-0">{{ $t("Sonde Passive") }}</li>
            <li class="list-group-item px-0">{{ $t("Sonde Push") }}</li>
            <li class="list-group-item px-0">{{ $t("Serveur de jeu Steam") }}</li>
            <li class="list-group-item px-0">GameDig</li>
          </ul>
        </div>
        <div class="col-md-6">
          <ul class="list-group list-group-flush mb-3">
            <li class="list-group-item px-0">Microsoft SQL Server</li>
            <li class="list-group-item px-0">PostgreSQL</li>
            <li class="list-group-item px-0">MySQL/MariaDB</li>
            <li class="list-group-item px-0">MongoDB</li>
            <li class="list-group-item px-0">Radius</li>
            <li class="list-group-item px-0">Redis</li>
            <li class="list-group-item px-0">MQTT</li>
            <li class="list-group-item px-0">RabbitMQ</li>
            <li class="list-group-item px-0">Kafka Producer</li>
          </ul>
        </div>
      </div>
      
      <div v-if="showAdvancedInfo" class="mt-3">
        <h6>{{ $t("Optimisations actives") }}:</h6>
        <ul class="list-group list-group-flush">
          <li class="list-group-item px-0 d-flex align-items-center">
            <i class="fas fa-check text-success me-2"></i>
            {{ $t("Ping WebSocket périodique (30s)") }}
          </li>
          <li class="list-group-item px-0 d-flex align-items-center">
            <i class="fas fa-check text-success me-2"></i>
            {{ $t("Reconnexion WebSocket améliorée") }}
          </li>
          <li class="list-group-item px-0 d-flex align-items-center">
            <i class="fas fa-check text-success me-2"></i>
            {{ $t("Modules inutilisés désactivés") }}
          </li>
          <li class="list-group-item px-0 d-flex align-items-center">
            <i class="fas fa-check text-success me-2"></i>
            {{ $t("Chargement incrémental des données") }}
          </li>
          <li class="list-group-item px-0 d-flex align-items-center">
            <i class="fas fa-check text-success me-2"></i>
            {{ $t("Compression des réponses") }}
          </li>
        </ul>
      </div>
      
      <button @click="showAdvancedInfo = !showAdvancedInfo" class="btn btn-sm btn-outline-secondary mt-3">
        <i class="fas" :class="showAdvancedInfo ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
        {{ showAdvancedInfo ? $t("Masquer les détails") : $t("Afficher les détails") }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "OptimizedModesInfo",
  data() {
    return {
      showAdvancedInfo: false
    };
  }
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  border-left: 4px solid #28a745;
}
</style>