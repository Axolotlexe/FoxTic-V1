<template>
  <div>
    <!-- Boutons du mode d'affichage -->
    <div class="shadow-box mb-3 d-flex justify-content-end">
      <button type="button" class="btn" :class="viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'" @click="viewMode = 'table'">
        <font-awesome-icon icon="table" />
      </button>
      <button type="button" class="btn ms-2" :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'" @click="viewMode = 'grid'">
        <font-awesome-icon icon="th-large" />
      </button>
    </div>

    <!-- Table View -->
    <div class="shadow-box monitor-table-container">
      <table class="table table-borderless table-hover">
        <thead>
          <tr>
            <th>{{ $t("Name") }}</th>
            <th>{{ $t("Status") }}</th>
            <th>{{ $t("DateTime") }}</th>
            <th>{{ $t("Message") }}</th>
            <th>{{ $t("Progress") }}</th>
            <th>{{ $t("Graph") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(monitor, index) in sortedMonitors" 
            :key="index" 
            :class="{ 'monitor-down': monitor.status === 0 }"
          >
            <td class="name-column">
              <router-link :to="`/dashboard/${monitor.id}`">{{ monitor.name }}</router-link>
            </td>
            <td><Status :status="monitor.status" /></td>
            <td><Datetime :value="monitor.lastHeartbeat?.time" /></td>
            <td>{{ monitor.lastHeartbeat?.msg }}</td>
            <td class="progress-column">
              <HeartbeatBar :status="monitor.status" />
            </td>
            <td class="graph-column">
              <SimpleChart :monitor-id="monitor.id" mini />
            </td>
          </tr>
          <tr v-if="Object.keys(monitors).length === 0">
            <td colspan="6" class="text-center py-4">
              {{ $t("No monitors to display") }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import Status from "../components/Status.vue";
import Datetime from "../components/Datetime.vue";
import HeartbeatBar from "../components/HeartbeatBar.vue";
import SimpleChart from "../components/SimpleChart.vue";

export default {
  components: {
    Status,
    Datetime,
    HeartbeatBar,
    SimpleChart
  },
  data() {
    return {
      viewMode: "table",
      monitors: {}
    };
  },
  computed: {
    sortedMonitors() {
      // Convertir l'objet en tableau
      const monitorsArray = Object.values(this.monitors);

      // Trier les moniteurs: DOWN en premier, puis par nom
      return monitorsArray.sort((a, b) => {
        if (a.status === 0 && b.status !== 0) return -1;
        if (a.status !== 0 && b.status === 0) return 1;
        return a.name.localeCompare(b.name);
      });
    }
  },
  mounted() {
    this.getMonitorList();

    // Écouter les mises à jour de la liste de moniteurs
    this.$root.emitter.on("monitorList", this.updateMonitorList);
    
    // Écouter les nouveaux heartbeats
    this.$root.emitter.on("heartbeat", this.updateMonitorHeartbeat);
  },
  beforeUnmount() {
    // Supprimer les écouteurs d'événements
    this.$root.emitter.off("monitorList", this.updateMonitorList);
    this.$root.emitter.off("heartbeat", this.updateMonitorHeartbeat);
  },
  methods: {
    /**
     * Récupère la liste des moniteurs
     * @returns {void}
     */
    getMonitorList() {
      this.monitors = this.$root.monitorList || {};
    },
    
    /**
     * Met à jour la liste des moniteurs
     * @param {Object} list - La nouvelle liste de moniteurs
     * @returns {void}
     */
    updateMonitorList(list) {
      this.monitors = list;
    },
    
    /**
     * Met à jour les données lorsqu'un heartbeat est reçu
     * @param {Object} heartbeat - Le nouveau heartbeat
     * @returns {void}
     */
    updateMonitorHeartbeat(heartbeat) {
      if (this.monitors[heartbeat.monitorID]) {
        this.monitors[heartbeat.monitorID].lastHeartbeat = heartbeat;
        this.monitors[heartbeat.monitorID].status = heartbeat.status;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars";

.monitor-table-container {
  max-height: 75vh;
  overflow-y: auto;
}

/* Animation pour les éléments en état DOWN */
@keyframes flash-red {
  0%, 100% {
    background-color: transparent;
    border-color: $danger;
  }
  50% {
    background-color: rgba($danger, 0.1);
    border-color: $danger;
  }
}

tr.monitor-down {
  animation: flash-red 2s infinite;
  border-left: 3px solid $danger;
  position: relative;
}

.name-column {
  min-width: 150px;
}

.progress-column {
  min-width: 120px;
}

.graph-column {
  min-width: 200px;
}

@media screen and (min-width: 1280px) {
  .name-column {
    min-width: 200px;
  }
}
</style>