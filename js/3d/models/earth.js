import * as THREE from 'three';

export class Earth extends THREE.Group {
    constructor() {
        super();
        this.createEarth();
        this.createAtmosphere();
    }

    createEarth() {
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x4287f5,
        });
        const earth = new THREE.Mesh(geometry, material);
        this.add(earth);
    }

    createAtmosphere() {
        const geometry = new THREE.SphereGeometry(1.1, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.2,
        });
        const atmosphere = new THREE.Mesh(geometry, material);
        this.add(atmosphere);
    }
}
