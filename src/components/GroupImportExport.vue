<template>
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ $t("FoxTic Group Import / Export") }}</h5>
                <button type="button" class="btn-close" @click="$emit('close')" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div v-if="step === 'select-action'" class="action-selection">
                    <div class="mb-3">
                        <button class="btn btn-primary w-100 p-3 mb-3" @click="step = 'export'">
                            <font-awesome-icon icon="file-export" class="me-2" /> 
                            {{ $t("Export Groups") }}
                        </button>
                        <div class="text-muted mb-4">{{ $t("Export your monitor groups to a JSON file that can be imported later.") }}</div>
                        
                        <button class="btn btn-primary w-100 p-3" @click="step = 'import'">
                            <font-awesome-icon icon="file-import" class="me-2" /> 
                            {{ $t("Import Groups") }}
                        </button>
                        <div class="text-muted">{{ $t("Import monitor groups from a previously exported JSON file.") }}</div>
                    </div>
                </div>
                
                <!-- Export Step -->
                <div v-if="step === 'export'" class="export-section">
                    <div class="alert alert-info">
                        <font-awesome-icon icon="info-circle" class="me-2" />
                        {{ $t("Select groups to export. All monitors within these groups will be included.") }}
                    </div>
                    
                    <div v-if="groups.length === 0" class="text-center my-4">
                        <div class="text-muted">{{ $t("No groups available to export") }}</div>
                    </div>
                    
                    <div v-else class="group-selection">
                        <div class="select-all mb-2">
                            <div class="form-check">
                                <input 
                                    class="form-check-input" 
                                    type="checkbox" 
                                    id="select-all-groups"
                                    v-model="selectAll"
                                    @change="toggleSelectAll"
                                >
                                <label class="form-check-label" for="select-all-groups">
                                    {{ $t("Select All Groups") }}
                                </label>
                            </div>
                        </div>
                        
                        <div class="group-list">
                            <div v-for="group in groups" :key="group.id" class="form-check mb-2">
                                <input 
                                    class="form-check-input" 
                                    type="checkbox" 
                                    :id="'group-' + group.id"
                                    v-model="selectedGroups"
                                    :value="group.id"
                                >
                                <label class="form-check-label" :for="'group-' + group.id">
                                    {{ group.name }}
                                    <span class="text-muted ms-2">
                                        ({{ getMonitorsCount(group.id) }} {{ $t("monitors") }})
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Import Step -->
                <div v-if="step === 'import'" class="import-section">
                    <div class="alert alert-info mb-3">
                        <font-awesome-icon icon="info-circle" class="me-2" />
                        {{ $t("Import monitors from a JSON file. Select a file to continue.") }}
                    </div>
                    
                    <div class="mb-3">
                        <a href="#" @click.prevent="downloadExampleFile" class="text-primary">
                            <font-awesome-icon icon="download" class="me-1" />
                            {{ $t("Download Example Import File") }}
                        </a>
                        <div class="text-muted small mt-1">
                            {{ $t("Use this example as a template for creating your own import files.") }}
                        </div>
                    </div>
                    
                    <div class="file-input mb-3">
                        <label for="import-file" class="form-label">{{ $t("Import File") }}</label>
                        <input 
                            class="form-control" 
                            type="file" 
                            id="import-file"
                            accept=".json"
                            ref="fileInput"
                            @change="handleFileChange"
                        >
                    </div>
                    
                    <div v-if="importData" class="import-preview">
                        <h6>{{ $t("Import Preview") }}</h6>
                        <div class="alert alert-success">
                            <font-awesome-icon icon="check-circle" class="me-2" />
                            {{ $t("Valid import file") }}
                        </div>
                        
                        <div class="import-summary">
                            <div class="import-info-item">
                                <span class="import-label">{{ $t("Source") }}:</span> 
                                <span>FoxTic</span>
                            </div>
                            <div class="import-info-item">
                                <span class="import-label">{{ $t("Groups") }}:</span> 
                                <span>{{ Array.isArray(importData) ? importData.length : 0 }}</span>
                            </div>
                            <div class="import-info-item">
                                <span class="import-label">{{ $t("Monitors") }}:</span>
                                <span>{{ Array.isArray(importData) ? 
                                    importData.reduce((total, g) => total + (g.monitors ? g.monitors.length : 0), 0) : 0 
                                }}</span>
                            </div>
                            <div class="import-info-item">
                                <span class="import-label">{{ $t("Format") }}:</span>
                                <span>{{ Array.isArray(importData) ? "Simplifié" : "Legacy" }}</span>
                            </div>
                        </div>
                        
                        <div class="group-list mt-3">
                            <div v-for="(group, index) in Array.isArray(importData) ? importData : []" :key="index" class="group-item">
                                <strong>{{ group.group || group.name }}</strong>
                                <div class="text-muted">
                                    {{ group.monitors ? group.monitors.length : 0 }} {{ $t("monitors") }}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="importError" class="alert alert-danger">
                        <font-awesome-icon icon="exclamation-circle" class="me-2" />
                        {{ importError }}
                    </div>
                </div>
                
                <div v-if="successMessage" class="alert alert-success mt-3">
                    <font-awesome-icon icon="check-circle" class="me-2" />
                    {{ successMessage }}
                </div>
                
                <div v-if="errorMessage" class="alert alert-danger mt-3">
                    <font-awesome-icon icon="exclamation-circle" class="me-2" />
                    {{ errorMessage }}
                </div>
            </div>
            
            <div class="modal-footer">
                <button 
                    v-if="step !== 'select-action'" 
                    class="btn btn-outline-secondary" 
                    @click="step = 'select-action'"
                >
                    {{ $t("Back") }}
                </button>
                
                <button 
                    v-if="step === 'export'" 
                    class="btn btn-primary" 
                    :disabled="selectedGroups.length === 0 || loading"
                    @click="exportSelectedGroups"
                >
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    {{ $t("Export") }}
                </button>
                
                <button 
                    v-if="step === 'import'" 
                    class="btn btn-primary" 
                    :disabled="!importData || loading"
                    @click="importGroups"
                >
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                    {{ $t("Import") }}
                </button>
                
                <button class="btn btn-secondary" @click="$emit('close')">
                    {{ $t("Close") }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import exampleImportFile from "../assets/foxtic-groups-example.json";

export default {
    emits: [ "close" ],
    
    data() {
        return {
            step: "select-action",
            groups: [],
            selectedGroups: [],
            selectAll: false,
            importData: null,
            importError: null,
            successMessage: null,
            errorMessage: null,
            loading: false
        };
    },
    
    mounted() {
        this.getGroups();
    },
    
    methods: {
        /**
         * Get groups for this user
         * @returns {void}
         */
        getGroups() {
            // Get list of groups from the monitor list (type: "group")
            this.groups = Object.values(this.$root.monitorList || {})
                .filter(m => m.type === "group");
        },
        
        /**
         * Count monitors in a group
         * @param {number} groupId The group ID
         * @returns {number} Number of monitors in group
         */
        getMonitorsCount(groupId) {
            return Object.values(this.$root.monitorList || {})
                .filter(m => m.parent === groupId).length;
        },
        
        /**
         * Toggle all groups selection
         * @returns {void}
         */
        toggleSelectAll() {
            if (this.selectAll) {
                this.selectedGroups = this.groups.map(g => g.id);
            } else {
                this.selectedGroups = [];
            }
        },
        
        /**
         * Handle file selection change
         * @param {Event} event File input change event
         * @returns {void}
         */
        handleFileChange(event) {
            const file = event.target.files[0];
            this.importData = null;
            this.importError = null;
            
            if (!file) return;
            
            // Parse the JSON file
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate the data structure - support both formats
                    let importGroups = null;
                    
                    // Check if it's the new simplified array format
                    if (Array.isArray(data)) {
                        console.log("Detected new simplified array format");
                        importGroups = data;
                    } 
                    // Check if it's the legacy format with version/groups properties
                    else if (typeof data === "object" && data.groups && Array.isArray(data.groups)) {
                        console.log("Detected legacy format with groups property");
                        importGroups = data.groups;
                    }
                    
                    // If neither format is valid
                    if (!importGroups) {
                        this.importError = this.$t("Format de fichier d'import invalide");
                        console.error("Invalid import format:", data);
                        return;
                    }
                    
                    // Validate that at least one group exists
                    if (importGroups.length === 0) {
                        this.importError = this.$t("Le fichier d'import ne contient aucun groupe");
                        return;
                    }
                    
                    // All good, store the import data
                    this.importData = importGroups;
                } catch (error) {
                    this.importError = this.$t("Failed to parse import file: {0}", [error.message]);
                }
            };
            
            reader.readAsText(file);
        },
        
        /**
         * Export selected groups
         * @returns {void}
         */
        exportSelectedGroups() {
            if (this.selectedGroups.length === 0) return;
            
            this.loading = true;
            this.successMessage = null;
            this.errorMessage = null;
            
            // Call the server to get export data
            this.$root.getSocket().emit("exportGroups", this.selectedGroups, (res) => {
                this.loading = false;
                
                if (res.ok && res.data) {
                    // Create a download link for the JSON data
                    const dataStr = JSON.stringify(res.data, null, 2);
                    const dataBlob = new Blob([dataStr], { type: "application/json" });
                    
                    const downloadLink = document.createElement("a");
                    downloadLink.href = URL.createObjectURL(dataBlob);
                    downloadLink.download = `foxtic-groups-${new Date().toISOString().split("T")[0]}.json`;
                    downloadLink.click();
                    
                    this.successMessage = this.$t("Successfully exported {0} groups", [this.selectedGroups.length]);
                } else {
                    this.errorMessage = res.msg || this.$t("Failed to export groups");
                }
            });
        },
        
        /**
         * Import groups from file
         * @returns {void}
         */
        importGroups() {
            if (!this.importData) return;
            
            this.loading = true;
            this.successMessage = null;
            this.errorMessage = null;
            
            // Create a timeout to prevent infinite spinning
            const importTimeout = setTimeout(() => {
                if (this.loading) {
                    this.loading = false;
                    this.errorMessage = this.$t("L'importation a pris trop de temps. Veuillez réessayer.");
                    console.error("Import groups timeout");
                }
            }, 15000); // 15 seconds timeout
            
            console.log("Sending import data to server", JSON.stringify(this.importData).substring(0, 200) + "...");
            
            // Send the import data to the server
            this.$root.getSocket().emit("importGroups", this.importData, (res) => {
                clearTimeout(importTimeout);
                this.loading = false;
                
                // Check if response exists
                if (!res) {
                    this.errorMessage = this.$t("Aucune réponse du serveur. Veuillez réessayer.");
                    console.error("No response from server during import");
                    return;
                }
                
                if (res.ok) {
                    this.successMessage = res.msg || this.$t("Groupes importés avec succès");
                    
                    // Clear the import data and file input
                    this.importData = null;
                    if (this.$refs.fileInput) {
                        this.$refs.fileInput.value = "";
                    }
                    
                    // Trigger a refresh of the monitor list to show the new groups
                    this.$root.getSocket().emit("getMonitorList");
                } else {
                    this.errorMessage = res.msg || this.$t("Échec de l'importation des groupes");
                    console.error("Import error:", res.msg);
                }
            });
        },
        
        /**
         * Download example import file
         * @returns {void}
         */
        downloadExampleFile() {
            // Create a download link for the example JSON data
            const dataStr = JSON.stringify(exampleImportFile, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(dataBlob);
            downloadLink.download = "foxtic-groups-example.json";
            downloadLink.click();
        }
    }
};
</script>

<style lang="scss" scoped>
.action-selection {
    text-align: center;
    
    button {
        font-size: 1.1em;
    }
}

.group-list {
    max-height: 300px;
    overflow-y: auto;
    padding: 10px;
    border: 1px solid #dee2e6;
    border-radius: 5px;
}

.group-item {
    padding: 8px;
    border-bottom: 1px solid #eee;
    
    &:last-child {
        border-bottom: none;
    }
}

.import-summary {
    background-color: #f8f9fa;
    padding: 10px;
    border-radius: 5px;
    margin-top: 10px;
    
    .import-info-item {
        margin-bottom: 5px;
        display: flex;
        align-items: center;
        
        .import-label {
            display: inline-block;
            font-weight: bold;
            background-color: #0d6efd;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            margin-right: 8px;
            min-width: 100px;
            text-align: left;
        }
    }
}
</style>