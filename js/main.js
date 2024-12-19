import { ClimateModel } from './model.js';
import { Plots } from './plots.js';
import { Controls } from './controls.js';
import { MODEL_PARAMS, SIMULATION_PARAMS } from '../data/constants.js';

class ClimateViz {
    constructor() {
        this.model = new ClimateModel();
        this.plots = new Plots();
        this.controls = new Controls(params => this.handleParameterChange(params));
        
        // Initial render
        this.handleParameterChange({
            greenhouse: MODEL_PARAMS.DEFAULT_GREENHOUSE,
            initialTemp: MODEL_PARAMS.DEFAULT_TEMP
        });

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleParameterChange(params) {
        this.updatePlots(params);
    }

    updatePlots(params) {
        const { greenhouse, initialTemp } = params;

        // Run simulation for 10 years
        const YEAR_IN_SECONDS = 365 * 24 * 3600;
        const SIMULATION_TIME = 10 * YEAR_IN_SECONDS;
        const timeSteps = 1000;
        const dt = SIMULATION_TIME / timeSteps;

        const simulation = this.model.simulateTemperature(
            initialTemp, 
            greenhouse,
            timeSteps,
            dt
        );
        const equilibriumTemp = simulation.temperatures[simulation.temperatures.length - 1];
        
        // Display debug info
        document.querySelector('#debug-info').textContent = 
            `T0: ${initialTemp.toFixed(1)}K, Teq: ${equilibriumTemp.toFixed(1)}K, g: ${greenhouse.toFixed(2)}`;

        // Generate phase space data (dT/dt vs T)
        const temps = this.model.generateTempRange();
        const rates = temps.map(t => this.model.calculateDeltaT(t, greenhouse));
        const phaseData = {
            temperatures: temps,
            rates: rates,
            initialTemp
        };
        this.plots.updateEquilibriumPlot(phaseData, equilibriumTemp);

        // Update potential well plot
        const potentialValues = temps.map(t => 
            this.model.calculatePotential(t, greenhouse)
        );
        this.plots.updatePotentialPlot({
            temps,
            values: potentialValues,
            initialTemp
        }, equilibriumTemp);
    }

    handleResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.plots = new Plots();
            this.handleParameterChange(this.controls.getParameters());
        }, 250);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ClimateViz();
});
