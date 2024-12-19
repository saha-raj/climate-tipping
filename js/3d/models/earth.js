import * as THREE from 'three';

export class Earth extends THREE.Group {
    constructor() {
        super();
        this.createEarth();
        this.shadowGroup = null;
        this.shadowEndCap = null;  // Store reference to end cap
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
            opacity: 0.4,
        });
        const atmosphere = new THREE.Mesh(geometry, material);
        this.add(atmosphere);
    }

    createLightRay() {
        // Create a line extending from light source through Earth's center
        const points = [
            new THREE.Vector3(5, 0, 0),    // Start from light source
            new THREE.Vector3(-5, 0, 0)     // Extend through and past Earth
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0xffff00,  // Yellow line
            linewidth: 2
        });
        
        const lightRay = new THREE.Line(geometry, material);
        this.add(lightRay);
    }

    createShadowCone() {
        if (this.shadowGroup) {
            this.remove(this.shadowGroup);
        }

        const radius = 1;
        const height = 6;
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        
        geometry.rotateZ(-Math.PI / 2);
        geometry.translate(-height/2, 0, 0);
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const shadowCone = new THREE.Mesh(geometry, material);
        
        // Create and store end cap
        const capGeometry = new THREE.CircleGeometry(radius, 32);
        const capMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.shadowEndCap = new THREE.Mesh(capGeometry, capMaterial);
        this.shadowEndCap.position.x = -height;
        this.shadowEndCap.rotateY(Math.PI / 2);
        
        this.shadowGroup = new THREE.Group();
        this.shadowGroup.add(shadowCone);
        this.shadowGroup.add(this.shadowEndCap);
        
        this.add(this.shadowGroup);
    }

    getShadowEndCapPosition() {
        if (!this.shadowEndCap) return null;
        
        // Get world position of end cap
        const position = new THREE.Vector3();
        this.shadowEndCap.getWorldPosition(position);
        return position;
    }
}
