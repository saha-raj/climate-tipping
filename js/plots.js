import { MODEL_PARAMS, SIMULATION_PARAMS } from '../data/constants.js';

export class Plots {
    constructor() {
        this.margins = { top: 40, right: 40, bottom: 60, left: 60 };
        this.setupPlots();
        
        // Get dot radius from CSS
        const computedStyle = getComputedStyle(document.documentElement);
        this.DOT_RADIUS = parseFloat(computedStyle.getPropertyValue('--dot-radius'));
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

        // Add arrow marker definition
        plotArea.selectAll('defs').remove();
        const defs = plotArea.append('defs');
        defs.append('marker')
            .attr('id', 'arrow')
            .attr('markerUnits', 'strokeWidth')
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 8)
            .attr('refY', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,1 L6,5 L0,9')
            .attr('fill', 'none')
            .attr('stroke', '#666')
            .attr('stroke-width', 1.5);

        // Calculate where arrow should end (further from the black dot)
        const x1 = x(data.initialTemp);
        const x2 = x(equilibriumTemp);
        const dx = x2 - x1;
        const totalLength = Math.abs(dx);
        const arrowEnd = x1 + (dx * (totalLength - this.DOT_RADIUS) / totalLength);

        // Add arrow from initial to equilibrium point
        plotArea.selectAll('.trajectory-arrow').remove();
        plotArea.append('line')
            .attr('class', 'trajectory-arrow')
            .attr('x1', x1)
            .attr('y1', y(0))
            .attr('x2', arrowEnd)
            .attr('y2', y(0))
            .attr('stroke', '#666')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#arrow)');

        // Add points (on top of arrow)
        plotArea.selectAll('.equilibrium-point').remove();
        plotArea.append('circle')
            .attr('class', 'equilibrium-point')
            .attr('cx', x(equilibriumTemp))
            .attr('cy', y(0));

        plotArea.selectAll('.initial-point').remove();
        plotArea.append('circle')
            .attr('class', 'initial-point')
            .attr('cx', x(data.initialTemp))
            .attr('cy', y(0));
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

        // Original line definition for the full potential curve
        const potentialLine = d3.line()
            .x((d, i) => x(potentialData.temps[i]))
            .y(d => y(d));

        // Update the main potential curve
        plotArea.selectAll('.potential-line').remove();
        plotArea.append('path')
            .datum(potentialData.values)
            .attr('class', 'potential-line')
            .attr('fill', 'none')
            .attr('stroke', 'green')
            .attr('stroke-width', 2)
            .attr('d', potentialLine);

        // Add equilibrium point
        const eqIndex = d3.bisector(d => d).left(potentialData.temps, equilibriumTemp);
        const eqPotential = potentialData.values[eqIndex];
        plotArea.selectAll('.equilibrium-point').remove();
        plotArea.append('circle')
            .attr('class', 'equilibrium-point')
            .attr('cx', x(equilibriumTemp))
            .attr('cy', y(eqPotential));

        // Add initial condition point
        const initialIndex = d3.bisector(d => d).left(potentialData.temps, potentialData.initialTemp);
        const initialPotential = potentialData.values[initialIndex];
        plotArea.selectAll('.initial-point').remove();
        plotArea.append('circle')
            .attr('class', 'initial-point')
            .attr('cx', x(potentialData.initialTemp))
            .attr('cy', y(initialPotential));

        // Add arrow marker definition
        plotArea.selectAll('defs').remove();
        const defs = plotArea.append('defs');
        defs.append('marker')
            .attr('id', 'curved-arrow')
            .attr('markerUnits', 'strokeWidth')
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('viewBox', '0 0 10 10')
            .attr('refX', 8)
            .attr('refY', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,1 L6,5 L0,9')
            .attr('fill', 'none')
            .attr('stroke', '#666')
            .attr('stroke-width', 1.5);

        // Find indices for our points
        const startIndex = d3.bisector(d => d).left(potentialData.temps, potentialData.initialTemp);
        const endIndex = d3.bisector(d => d).left(potentialData.temps, equilibriumTemp);
        
        // Extract the segment of values between our points, ensuring correct direction
        const segmentTemps = potentialData.temps.slice(
            Math.min(startIndex, endIndex), 
            Math.max(startIndex, endIndex) + 1
        );
        const segmentValues = potentialData.values.slice(
            Math.min(startIndex, endIndex), 
            Math.max(startIndex, endIndex) + 1
        );

        // If we need to go backwards, reverse the arrays
        if (startIndex > endIndex) {
            segmentTemps.reverse();
            segmentValues.reverse();
        }

        // Create path segment
        const segmentLine = d3.line()
            .x((d, i) => x(segmentTemps[i]))
            .y(d => y(d));

        // Calculate path length and trim end
        const tempPath = plotArea.append('path')
            .attr('d', segmentLine(segmentValues))
            .style('display', 'none');
        
        const pathLength = tempPath.node().getTotalLength();
        const trimmedLength = pathLength - this.DOT_RADIUS * 3;  // Increased trim amount
        tempPath.remove();

        // Add the curved arrow path
        plotArea.selectAll('.trajectory-arrow').remove();
        plotArea.append('path')
            .attr('class', 'trajectory-arrow')
            .datum(segmentValues)
            .attr('d', segmentLine)
            .attr('fill', 'none')
            .attr('stroke', '#666')
            .attr('stroke-width', 2)
            .attr('marker-end', 'url(#curved-arrow)')
            .style('stroke-dasharray', `${trimmedLength} ${pathLength}`);
    }
}
