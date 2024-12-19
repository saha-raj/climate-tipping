import { MODEL_PARAMS } from '../data/constants.js';

export class Controls {
    constructor(onParameterChange) {
        this.onParameterChange = onParameterChange;
        this.setupControls();
    }

    setupControls() {
        this.greenhouseSlider = this.setupSlider('#greenhouse', 
            MODEL_PARAMS.DEFAULT_GREENHOUSE,
            value => this.updateValueDisplay('greenhouse-value', parseFloat(value).toFixed(2)));

        this.tempSlider = this.setupSlider('#initial-temp', 
            MODEL_PARAMS.DEFAULT_TEMP,
            value => this.updateValueDisplay('initial-temp-value', Math.round(value)));

        // Setup run button
        this.runButton = document.querySelector('#run-simulation');
        this.runButton.addEventListener('click', () => this.runSimulation());

        // Initial parameter broadcast
        this.broadcastParameters();
    }

    setupSlider(selector, defaultValue, onUpdate) {
        const slider = document.querySelector(selector);
        slider.value = defaultValue;
        
        // Update display and broadcast on change
        slider.addEventListener('input', (e) => {
            onUpdate(e.target.value);
            this.broadcastParameters();
        });

        // Initial display update
        onUpdate(defaultValue.toString());
        
        return slider;
    }

    updateValueDisplay(elementId, value) {
        document.querySelector(`#${elementId}`).textContent = value;
    }

    getParameters() {
        return {
            greenhouse: parseFloat(this.greenhouseSlider.value),
            initialTemp: parseFloat(this.tempSlider.value)
        };
    }

    broadcastParameters() {
        this.onParameterChange(this.getParameters());
    }

    runSimulation() {
        this.runButton.disabled = true;
        this.broadcastParameters();
        
        // Re-enable after short delay to prevent spam clicking
        setTimeout(() => {
            this.runButton.disabled = false;
        }, 500);
    }

    // Enable/disable all controls
    setControlsEnabled(enabled) {
        this.greenhouseSlider.disabled = !enabled;
        this.tempSlider.disabled = !enabled;
        this.runButton.disabled = !enabled;
    }
}
