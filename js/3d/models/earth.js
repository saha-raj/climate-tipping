import * as THREE from 'three';

export class Earth extends THREE.Group {
    constructor() {
        super();
        this.createEarth();
        this.createAtmosphere();
        this.createShadowCone();
        this.createLightRay();
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
        // Create cylinder for shadow cone
        const radius = 1;    // Match Earth's radius
        const height = 6;    // 3 Earth diameters long
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        
        // Align cylinder with light direction (along x-axis)
        geometry.rotateZ(-Math.PI / 2);  // Rotate to point along x-axis
        geometry.translate(-height/2, 0, 0);  // Center cylinder at origin, extending in -x direction
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const shadowCone = new THREE.Mesh(geometry, material);
        
        // Add end cap
        const capGeometry = new THREE.CircleGeometry(radius, 32);
        const capMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.DoubleSide
        });
        const cap = new THREE.Mesh(capGeometry, capMaterial);
        cap.position.x = -height;  // Place at far end of cylinder
        cap.rotateY(Math.PI / 2);  // Orient perpendicular to cylinder axis
        
        // Create a group for shadow elements
        const shadowGroup = new THREE.Group();
        shadowGroup.add(shadowCone);
        shadowGroup.add(cap);
        
        this.add(shadowGroup);
    }
}
