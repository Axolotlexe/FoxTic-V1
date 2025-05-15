<template>
    <div class="horizontal-chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
    </div>
</template>

<script lang="js">
import { BarController, BarElement, Chart, Filler, LinearScale, LineController, LineElement, PointElement, TimeScale, Tooltip } from "chart.js";
import "chartjs-adapter-dayjs-4";
import { Line } from "vue-chartjs";
import { UP, DOWN, PENDING, MAINTENANCE } from "../util.ts";

Chart.register(LineController, BarController, LineElement, PointElement, TimeScale, BarElement, LinearScale, Tooltip, Filler);

export default {
    components: { Line },
    props: {
        /** ID of monitor */
        monitorId: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            loading: false,
        };
    },
    computed: {
        chartOptions() {
            return {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',  // Horizontal chart
                animation: false,
                layout: {
                    padding: {
                        left: 5,
                        right: 5,
                        top: 5,
                        bottom: 5,
                    },
                },
                elements: {
                    point: {
                        radius: 0,
                    },
                    line: {
                        borderWidth: 1.5,
                    }
                },
                scales: {
                    x: {
                        type: "time",
                        time: {
                            minUnit: "minute",
                            round: "second",
                            displayFormats: {
                                minute: "HH:mm",
                                hour: "MM-DD HH:mm",
                            }
                        },
                        ticks: {
                            display: false,
                        },
                        grid: {
                            display: false,
                        },
                        border: {
                            display: false,
                        }
                    },
                    y: {
                        display: false,
                        grid: {
                            display: false,
                        },
                        border: {
                            display: false,
                        }
                    },
                    y1: {
                        display: false,
                        position: "right",
                        grid: {
                            drawOnChartArea: false,
                        },
                        min: 0,
                        max: 1,
                    },
                },
                plugins: {
                    tooltip: {
                        enabled: false,
                    },
                    legend: {
                        display: false,
                    },
                },
            };
        },
        chartData() {
            return this.getChartDatapoints();
        },
    },
    methods: {
        getChartDatapoints() {
            let pingData = [];
            let downData = [];
            let colorData = [];

            let heartbeatList = (this.monitorId in this.$root.heartbeatList && this.$root.heartbeatList[this.monitorId]) || [];
            
            // Limiter le nombre de points de données pour le graphique horizontal
            const limitedHeartbeatList = heartbeatList.slice(0, 20);

            for (const beat of limitedHeartbeatList) {
                const beatTime = this.$root.toDayjs(beat.time);
                const x = beatTime.format("YYYY-MM-DD HH:mm:ss");

                pingData.push({
                    x,
                    y: 0, // Single y value for horizontal chart
                });
                
                downData.push({
                    x,
                    y: (beat.status === DOWN || beat.status === MAINTENANCE || beat.status === PENDING) ? 1 : 0,
                });
                
                switch (beat.status) {
                    case MAINTENANCE:
                        colorData.push("rgba(23, 71, 245, 0.41)");
                        break;
                    case PENDING:
                        colorData.push("rgba(245, 182, 23, 0.41)");
                        break;
                    case DOWN:
                        colorData.push("rgba(220, 53, 69, 0.41)");
                        break;
                    default:
                        colorData.push("rgba(92, 221, 139, 0.41)");
                }
            }

            return {
                datasets: [
                    {
                        // Line Chart
                        data: pingData,
                        tension: 0.2,
                        borderColor: "#5CDD8B",
                        borderWidth: 2,
                        pointRadius: 0,
                        yAxisID: "y",
                        label: "ping",
                    },
                    {
                        // Bar Chart for status
                        type: "bar",
                        data: downData,
                        borderColor: "#00000000",
                        backgroundColor: colorData,
                        yAxisID: "y1",
                        barThickness: 8,
                        inflateAmount: 0,
                        label: "status",
                    },
                ],
            };
        },
    },
};
</script>

<style lang="scss" scoped>
.horizontal-chart-wrapper {
    height: 20px;
    position: relative;
    width: 100%;
    margin: 0;
    padding: 0;
}
</style>