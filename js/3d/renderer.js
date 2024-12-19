import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EarthScene } from './scenes/earth.js';
import { SceneManager } from './sceneManager.js';

class Renderer {
    constructor() {
        this.container = document.getElementById('scene-container');
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        
        // Create Earth scene
        this.earthScene = new EarthScene();
        this.scene.add(this.earthScene);
        
        // Pass both renderer and earthScene references
        this.sceneManager = new SceneManager({
            renderer: this,
            earthScene: this.earthScene
        });
        
        // Fix camera position
        this.camera.position.set(8, 6, -12);
        this.camera.lookAt(0, 0, 0);
        
        this.animate();
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x333333);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            45,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        // Fixed camera position
        this.camera.position.set(8, 6, -12);
        this.camera.lookAt(0, 0, 0);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 0, 0);
        this.scene.add(directionalLight);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update scene
        this.earthScene.update();
        
        // Update annotation positions if they exist
        if (this.sceneManager) {
            this.sceneManager.updateAnnotationPosition();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Renderer();
});
