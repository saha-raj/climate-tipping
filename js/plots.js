import { MODEL_PARAMS, SIMULATION_PARAMS } from '../data/constants.js';

export class Plots {
    constructor() {
        this.margins = { top: 40, right: 40, bottom: 60, left: 60 };
        this.setupPlots();
    }

    setupPlots() {
        this.phasePlot = this.createPlot('#equilibrium-plot .plot-area', 
            'Temperature (K)', 'dT/dt (K/s)');
        this.potentialPlot = this.createPlot('#potential-well-plot .plot-area', 
            'Temperature (K)', 'Potential');
    }

    createPlot(selector, xLabel, yLabel) {
        const container = d3.select(selector);
        const width = container.node().getBoundingClientRect().width;
        const height = width * 0.5;  // Reduced height to width ratio

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const plotArea = svg.append('g')
            .attr('transform', `translate(${this.margins.left},${this.margins.top})`);

        // Add axes with fewer ticks
        plotArea.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height - this.margins.top - this.margins.bottom})`);
        
        plotArea.append('g')
            .attr('class', 'y-axis');

        // Add labels
        svg.append('text')
            .attr('class', 'x-label')
            .attr('text-anchor', 'middle')
            .attr('x', width/2)
            .attr('y', height - 10)
            .text(xLabel);

        svg.append('text')
            .attr('class', 'y-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height/2)
            .attr('y', 20)
            .text(yLabel);

        return { svg, plotArea, width, height };
    }

    updateEquilibriumPlot(data, equilibriumTemp) {
        const { svg, plotArea, width, height } = this.phasePlot;
        const plotWidth = width - this.margins.left - this.margins.right;
        const plotHeight = height - this.margins.top - this.margins.bottom;

        const x = d3.scaleLinear()
            .domain([MODEL_PARAMS.MIN_TEMP, MODEL_PARAMS.MAX_TEMP])
            .range([0, plotWidth]);

        const y = d3.scaleLinear()
            .domain(d3.extent(data.rates))
            .range([plotHeight, 0]);

        // Update axes with fewer, rounded ticks
        plotArea.select('.x-axis')
            .call(d3.axisBottom(x)
                .ticks(5)
                .tickFormat(d => Math.round(d)));
        
        plotArea.select('.y-axis')
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickFormat(d => d.toFixed(0)));

        // Add zero line
        plotArea.selectAll('.zero-line').remove();
        plotArea.append('line')
            .attr('class', 'zero-line')
            .attr('x1', 0)
            .attr('x2', plotWidth)
            .attr('y1', y(0))
            .attr('y2', y(0))
            .attr('stroke', '#ccc')
            .attr('stroke-dasharray', '4,4');

        // Update line
        const line = d3.line()
            .x((d, i) => x(data.temperatures[i]))
            .y(d => y(d));

        plotArea.selectAll('.rate-line').remove();
        plotArea.append('path')
            .datum(data.rates)
            .attr('class', 'rate-line')
            .attr('fill', 'none')
            .attr('stroke', 'red')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Add equilibrium point
        plotArea.selectAll('.equilibrium-point').remove();
        plotArea.append('circle')
            .attr('class', 'equilibrium-point')
            .attr('cx', x(equilibriumTemp))
            .attr('cy', y(0))  // y=0 for dT/dt=0
            .attr('r', 4)
            .attr('fill', 'black');
    }

    updatePotentialPlot(potentialData, equilibriumTemp) {
        const { svg, plotArea, width, height } = this.potentialPlot;
        const plotWidth = width - this.margins.left - this.margins.right;
        const plotHeight = height - this.margins.top - this.margins.bottom;

        const x = d3.scaleLinear()
            .domain([MODEL_PARAMS.MIN_TEMP, MODEL_PARAMS.MAX_TEMP])
            .range([0, plotWidth]);

        const y = d3.scaleLinear()
            .domain(d3.extent(potentialData.values))
            .range([plotHeight, 0]);

        // Update axes with fewer, rounded ticks
        plotArea.select('.x-axis')
            .call(d3.axisBottom(x)
                .ticks(5)
                .tickFormat(d => Math.round(d)));
        
        plotArea.select('.y-axis')
            .call(d3.axisLeft(y)
                .ticks(5)
                .tickFormat(d => Math.round(d)));

        // Update line
        const line = d3.line()
            .x((d, i) => x(potentialData.temps[i]))
            .y(d => y(d));

        plotArea.selectAll('.potential-line').remove();
        plotArea.append('path')
            .datum(potentialData.values)
            .attr('class', 'potential-line')
            .attr('fill', 'none')
            .attr('stroke', 'green')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Find closest temperature index
        const eqIndex = d3.bisector(d => d).left(potentialData.temps, equilibriumTemp);
        const eqPotential = potentialData.values[eqIndex];

        console.log('Potential plot debug:', {
            equilibriumTemp,
            temps: potentialData.temps,
            index: eqIndex,
            nearestTemp: potentialData.temps[eqIndex],
            potentialValue: eqPotential,
            yScale: y.domain()
        });

        // Add equilibrium point
        plotArea.selectAll('.equilibrium-point').remove();
        plotArea.append('circle')
            .attr('class', 'equilibrium-point')
            .attr('cx', x(equilibriumTemp))
            .attr('cy', y(eqPotential))
            .attr('r', 4)
            .attr('fill', 'black');
    }
}
