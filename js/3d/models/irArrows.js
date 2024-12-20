import * as THREE from 'three';

export class IRArrows extends THREE.Group {
    constructor() {
        super();
        this.arrows = [];
        this.createArrows();
    }

    createArrows() {
        // Start with just a few test arrows
        const numArrows = 8;  // Small number for testing
        
        // Create points on sphere surface using simple latitude/longitude
        for (let i = 0; i < numArrows; i++) {
            const phi = Math.acos(-1 + (2 * i) / numArrows);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            
            // Convert spherical to cartesian coordinates (radius = 1)
            const x = Math.sin(phi) * Math.cos(theta);
            const y = Math.sin(phi) * Math.sin(theta);
            const z = Math.cos(phi);
            
            this.createSingleArrow(new THREE.Vector3(x, y, z));
        }
    }

    createSingleArrow(direction) {
        // Start with straight lines for testing
        const points = [
            direction.clone().multiplyScalar(1.0),    // Start at surface
            direction.clone().multiplyScalar(1.5)     // End 0.5 units out
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xff0000,  // Red for IR
            linewidth: 2
        });

        const arrow = new THREE.Line(geometry, material);
        this.arrows.push(arrow);
        this.add(arrow);
    }
}