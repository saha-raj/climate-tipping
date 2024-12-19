import * as THREE from 'three';
import { Earth } from '../models/earth.js';

export class EarthScene extends THREE.Group {
    constructor() {
        super();
        this.earth = new Earth();
        this.add(this.earth);
    }

    update() {
        // Empty update method for now
    }
}
