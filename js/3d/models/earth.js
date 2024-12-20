import * as THREE from 'three';

export class Earth extends THREE.Group {
    constructor() {
        super();
        this.createEarth();
        this.shadowGroup = null;
        this.shadowEndCap = null;  // Store reference to end cap
        this.irArrows = null;
        this.iceFragments = null;
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
        if (!this.atmosphere) {
            const geometry = new THREE.SphereGeometry(1.1, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: 0x88ccff,
                transparent: true,
                opacity: 0.4,
            });
            this.atmosphere = new THREE.Mesh(geometry, material);
            this.add(this.atmosphere);
        }
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
        
        // Store reference to end cap position
        this.shadowEndCapPosition = new THREE.Vector3(-height, 0, 0);
        
        this.shadowGroup = new THREE.Group();
        this.shadowGroup.add(shadowCone);
        this.shadowGroup.add(this.shadowEndCap);
        
        this.add(this.shadowGroup);
    }

    getShadowEndCapWorldPosition() {
        const position = new THREE.Vector3();
        this.shadowEndCap.getWorldPosition(position);
        return position;
    }

    createIRArrows() {
        if (!this.irArrows) {
            this.irArrows = new THREE.Group();
            
            // Arrow parameters
            const arrowLength = 1.5;  // Increased from 0.5 to 1.0
            const arrowColor = 0xff4444;
            const numArrows = 6;  // Reduced from 12 to 6 around equator
            const numLatitudes = 3;  // Keep 3 latitude bands
            
            // Add North pole arrow
            this.addWigglyArrow(new THREE.Vector3(0, 1, 0), arrowLength, arrowColor);
            
            // Add latitude band arrows
            for (let lat = 0; lat < numLatitudes; lat++) {
                const latAngle = (Math.PI / (numLatitudes + 1)) * (lat + 1);
                const radius = Math.sin(latAngle);
                const y = Math.cos(latAngle);
                
                for (let i = 0; i < numArrows; i++) {
                    const angle = (2 * Math.PI * i) / numArrows;
                    const x = radius * Math.cos(angle);
                    const z = radius * Math.sin(angle);
                    const direction = new THREE.Vector3(x, y, z).normalize();
                    this.addWigglyArrow(direction, arrowLength, arrowColor);
                }
            }
            
            // Add South pole arrow
            this.addWigglyArrow(new THREE.Vector3(0, -1, 0), arrowLength, arrowColor);
            
            this.add(this.irArrows);
        }
    }

    addWigglyArrow(direction, length, color) {
        // Constants
        const numPoints = 100;
        const amplitude = 0.05;
        const frequency = 16;
        const lineWidth = 0.012;
        const straightTipLength = 0.1;
        const arrowHeadLength = 0.12;
        const arrowHeadWidth = 0.08;
        
        const points = [];
        
        // Create random rotation around the direction vector
        const randomAngle = Math.random() * Math.PI * 2;
        const up = new THREE.Vector3(0, 1, 0);
        let perpWave = new THREE.Vector3().crossVectors(direction, up).normalize();
        if (perpWave.lengthSq() < 0.1) {
            perpWave.set(1, 0, 0);
        }
        
        perpWave.applyAxisAngle(direction, randomAngle);
        
        // Create the wave points
        const waveLength = length - straightTipLength;
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            const basePos = direction.clone().multiplyScalar(t * waveLength);
            
            const fadeOut = t > 0.8 ? (1 - (t - 0.8) / 0.2) : 1;
            const wave = Math.sin(t * Math.PI * frequency) * amplitude * fadeOut;
            
            const waveDisplacement = perpWave.clone().multiplyScalar(wave);
            const finalPos = basePos.add(waveDisplacement);
            points.push(finalPos);
        }
        
        // Add final straight segment
        const lastPoint = points[points.length - 1];
        const straightEnd = lastPoint.clone().add(direction.clone().multiplyScalar(straightTipLength));
        points.push(straightEnd);
        
        // Create the wave curve
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(
            curve, 
            128,
            lineWidth,
            12,
            false
        );
        const material = new THREE.MeshBasicMaterial({ color: color });
        const arrow = new THREE.Mesh(geometry, material);
        
        // Create arrowhead as two separate tubes
        const arrowHeadGroup = new THREE.Group();
        
        // Left side of arrowhead
        const leftPoint = new THREE.Vector3(-arrowHeadLength, arrowHeadWidth/2, 0);
        const tipPoint = new THREE.Vector3(0, 0, 0);
        const leftCurve = new THREE.LineCurve3(leftPoint, tipPoint);
        const leftTube = new THREE.Mesh(
            new THREE.TubeGeometry(leftCurve, 8, lineWidth, 8, false),
            material
        );
        
        // Right side of arrowhead
        const rightPoint = new THREE.Vector3(-arrowHeadLength, -arrowHeadWidth/2, 0);
        const rightCurve = new THREE.LineCurve3(rightPoint, tipPoint);
        const rightTube = new THREE.Mesh(
            new THREE.TubeGeometry(rightCurve, 8, lineWidth, 8, false),
            material
        );
        
        arrowHeadGroup.add(leftTube);
        arrowHeadGroup.add(rightTube);
        
        // Position and orient arrowhead
        arrowHeadGroup.position.copy(straightEnd);
        arrowHeadGroup.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);
        
        const arrowGroup = new THREE.Group();
        arrowGroup.add(arrow);
        arrowGroup.add(arrowHeadGroup);
        this.irArrows.add(arrowGroup);
    }

    createHexIce(hexSize = 0.05) {
        // Remove existing ice if any
        if (this.iceFragments) {
            this.remove(this.iceFragments);
            this.iceFragments = null;
        }

        this.iceFragments = new THREE.Group();

        // Create hexagon shape
        const hexShape = new THREE.Shape();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = hexSize * Math.cos(angle);
            const y = hexSize * Math.sin(angle);
            if (i === 0) {
                hexShape.moveTo(x, y);
            } else {
                hexShape.lineTo(x, y);
            }
        }
        hexShape.closePath();

        const hexGeometry = new THREE.ShapeGeometry(hexShape);
        const hexMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });

        // Fixed number of points
        const FIXED_NUM_HEXAGONS = 200;  // Adjust this number as needed
        
        // Generate points using Fibonacci sphere method
        const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
        
        for (let i = 0; i < FIXED_NUM_HEXAGONS; i++) {
            const y = 1 - (i / (FIXED_NUM_HEXAGONS - 1)) * 2; // -1 to 1
            const radius = Math.sqrt(1 - y * y);
            
            const theta = phi * i; // golden angle increment
            
            const x = Math.cos(theta) * radius;
            const z = Math.sin(theta) * radius;
            
            const hex = new THREE.Mesh(hexGeometry, hexMaterial);
            
            // Position slightly above surface
            hex.position.set(x, y, z);
            hex.position.multiplyScalar(1.001);
            
            // Orient to face outward
            hex.lookAt(new THREE.Vector3(0, 0, 0));
            
            this.iceFragments.add(hex);
        }

        this.add(this.iceFragments);
    }

    resizeHexIce(targetSize, duration = 1.0) {
        if (!this.iceFragments) return;
        
        const startTime = performance.now();
        const startScale = 1;
        const endScale = targetSize / 0.05;  // Calculate scale factor based on initial size of 0.05
        
        const animate = () => {
            const elapsed = (performance.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1.0);
            
            // Smooth easing
            const easedProgress = progress * (2 - progress);
            
            const currentScale = startScale + (endScale - startScale) * easedProgress;
            this.iceFragments.children.forEach(hex => {
                hex.scale.set(currentScale, currentScale, 1);
            });
            
            if (progress < 1.0) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
}
