import * as THREE from 'three';
import { ObjectRegistry } from './objectRegistry.js';

export class SceneManager {
    TEXT_POSITION = {
        top: '10%',
        left: '3rem',
        maxWidth: '400px'
    };

    DEFAULT_CAMERA = {
        position: new THREE.Vector3(8, 6, -12),
        target: new THREE.Vector3(0, 0, 0)
    };

    constructor({ renderer, earthScene }) {
        this.renderer = renderer;
        this.camera = renderer.camera;  // Store camera reference
        this.earthScene = earthScene;
        
        // Force scroll to top on page load/refresh
        window.history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
        
        this.currentScene = 0;
        this.currentState = 0;  // Track state within scene
        
        // Add object registry
        this.objectRegistry = new ObjectRegistry();
        
        this.setupScenes();

        // Add debounce to reduce jitter
        this.scrollTimeout = null;
        this.setupScrollHandler();
        this.scenes[1].states[0].setup();

        // Add this new property
        this.lastScrollY = 0;
    }

    setupScenes() {
        this.scenes = [
            {
                objects: ['earth'],
                states: [{
                    threshold: 0,
                    setup: () => {
                        this.resetToDefaultCamera();
                        this.updateText();
                    }
                }],
                exitThreshold: 0.1
            },
            {
                objects: ['earth', 'shadowCylinder', 'shadowAnnotation', 'scene1Text'],
                states: [
                    {
                        threshold: 0.1,
                        setup: () => {
                            this.resetToDefaultCamera();
                            this.updateText();
                        }
                    },
                    {
                        threshold: 0.3,
                        setup: () => {
                            this.earthScene.earth.createShadowCone();
                            
                            // Get annotation content from registry
                            const annotDef = this.objectRegistry.getDefinition('shadowAnnotation');
                            const annotationsContainer = document.getElementById('annotations-container');
                            annotationsContainer.innerHTML = `
                                <div class="annotation" style="opacity: 0">
                                    ${annotDef.content}
                                </div>
                            `;
                            
                            // Force browser reflow
                            void annotationsContainer.offsetHeight;
                            
                            // Fade in
                            const annotation = annotationsContainer.querySelector('.annotation');
                            annotation.style.opacity = '1';
                        }
                    }
                ],
                exitThreshold: 0.7
            },
            {
                objects: ['earth', 'irArrows', 'scene2Text'],
                states: [
                    {
                        threshold: 0.7,
                        setup: () => {
                            this.resetToDefaultCamera();
                            this.updateText();
                            if (this.earthScene.earth.shadowGroup) {
                                this.earthScene.earth.remove(this.earthScene.earth.shadowGroup);
                                this.earthScene.earth.shadowGroup = null;
                            }
                            this.earthScene.earth.createIRArrows();
                            
                            const annotDef = this.objectRegistry.getDefinition('irArrowsAnnotation');
                            const annotationsContainer = document.getElementById('annotations-container');
                            annotationsContainer.innerHTML = `
                                <div class="annotation" style="opacity: 0">
                                    ${annotDef.content}
                                </div>
                            `;
                            
                            void annotationsContainer.offsetHeight;
                            const annotation = annotationsContainer.querySelector('.annotation');
                            annotation.style.opacity = '1';
                        },
                        cleanup: () => {
                            // Clean up IR arrows when leaving Scene 2
                            if (this.earthScene.earth.irArrows) {
                                this.earthScene.earth.remove(this.earthScene.earth.irArrows);
                                this.earthScene.earth.irArrows = null;
                            }
                        }
                    },
                    {
                        threshold: 0.8,
                        setup: () => {
                            this.earthScene.earth.createAtmosphere();
                            
                            const annotDef = this.objectRegistry.getDefinition('atmosphereAnnotation');
                            const annotationsContainer = document.getElementById('annotations-container');
                            annotationsContainer.innerHTML = `
                                <div class="annotation" style="opacity: 0">
                                    ${annotDef.content}
                                </div>
                            `;
                            
                            void annotationsContainer.offsetHeight;
                            const annotation = annotationsContainer.querySelector('.annotation');
                            annotation.style.opacity = '1';
                        }
                    },
                    {
                        threshold: 0.85,
                        setup: () => {
                            // Keep same direction but zoom in
                            const zoomedPosition = this.DEFAULT_CAMERA.position.clone()
                                .normalize()
                                .multiplyScalar(4); // Closer distance of 4 units instead of original ~15
                            
                            this.animateCamera(
                                this.renderer.camera.position.clone(),
                                zoomedPosition,
                                this.DEFAULT_CAMERA.target,
                                2000 // 2 seconds duration
                            );
                        }
                    }
                ],
                exitThreshold: 1.0
            },
            {
                objects: ['earth', 'scene3Text'],
                states: [
                    {
                        threshold: 0.7,
                        setup: () => {
                            // Clear IR arrows if they exist
                            if (this.earthScene.earth.irArrows) {
                                this.earthScene.earth.remove(this.earthScene.earth.irArrows);
                                this.earthScene.earth.irArrows = null;
                            }
                            
                            // Create initial small hexagonal ice fragments
                            this.earthScene.earth.createHexIce(0.05);
                            
                            this.updateText();
                            
                            const annotDef = this.objectRegistry.getDefinition('albedoAnnotation');
                            const annotationsContainer = document.getElementById('annotations-container');
                            annotationsContainer.innerHTML = `
                                <div class="annotation" style="opacity: 0">
                                    ${annotDef.content}
                                </div>
                            `;
                            
                            void annotationsContainer.offsetHeight;
                            const annotation = annotationsContainer.querySelector('.annotation');
                            annotation.style.opacity = '1';
                        }
                    },
                    {
                        threshold: 0.8,
                        setup: () => {
                            this.earthScene.earth.resizeHexIce(0.1, 1.5);
                        }
                    },
                    {
                        threshold: 0.9,
                        setup: () => {
                            this.earthScene.earth.resizeHexIce(0.15, 1.5);
                        }
                    }
                ],
                exitThreshold: 1.0
            }
        ];
    }

    setupScrollHandler() {
        window.addEventListener('scroll', () => {
            if (this.scrollTimeout) {
                window.cancelAnimationFrame(this.scrollTimeout);
            }

            this.scrollTimeout = window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const windowHeight = window.innerHeight;
                const scrollFraction = scrollY / windowHeight;
                
                const currentSceneData = this.scenes[this.currentScene];

                // Handle backwards scrolling
                if (scrollFraction < currentSceneData.states[0].threshold && 
                    this.currentScene > 0) {
                    
                    // Clear only objects that aren't needed in the previous scene
                    this.clearSceneObjects(this.scenes[this.currentScene - 1]);
                    
                    // Go to previous scene's initial state
                    this.currentScene--;
                    this.currentState = 0;
                    this.scenes[this.currentScene].states[0].setup();
                    
                } else {
                    // Forward scrolling
                    currentSceneData.states.forEach((state, index) => {
                        if (scrollFraction >= state.threshold && this.currentState < index) {
                            this.currentState = index;
                            state.setup();
                        }
                    });

                    if (scrollFraction >= currentSceneData.exitThreshold && 
                        this.currentScene < this.scenes.length - 1) {
                        this.currentScene++;
                        this.currentState = 0;
                        this.scenes[this.currentScene].states[0].setup();
                    }
                }
            });
        });
    }

    clearSceneObjects(scene) {
        const earth = this.earthScene.earth;
        
        // Clear 3D objects
        if (earth.shadowGroup) {
            earth.remove(earth.shadowGroup);
            earth.shadowGroup = null;
        }
        
        if (earth.irArrows) {
            earth.remove(earth.irArrows);
            earth.irArrows = null;
        }
        
        if (earth.atmosphere) {
            earth.remove(earth.atmosphere);
            earth.atmosphere = null;
        }
        
        // Fade out annotations
        const annotations = document.querySelector('.annotation');
        if (annotations) {
            annotations.style.opacity = '0';
            setTimeout(() => {
                document.getElementById('annotations-container').innerHTML = '';
            }, 300);
        }
    }

    transitionToScene(newIndex) {
        if (newIndex !== this.currentScene && newIndex >= 1 && newIndex < this.scenes.length) {
            console.log(`Transitioning to scene ${newIndex}`);
            this.currentScene = newIndex;
            this.currentState = 0;  // Reset state counter
            this.scenes[newIndex].states[0].setup();
        }
    }

    updateText() {
        const currentScene = this.scenes[this.currentScene];
        let textId;
        
        switch(this.currentScene) {
            case 0:
                textId = 'introText';
                break;
            case 1:
                textId = 'scene1Text';
                break;
            case 2:
                textId = 'scene2Text';
                break;
            case 3:
                textId = 'scene3Text';
                break;
            default:
                textId = 'introText';
        }
        
        const textDef = this.objectRegistry.getDefinition(textId);
        
        const textOverlay = document.querySelector('.text-overlay');
        if (textOverlay && textDef) {
            // Apply position styles
            Object.assign(textOverlay.style, this.TEXT_POSITION);
            
            textOverlay.innerHTML = `
                <div class="scene-text">
                    <h2>${textDef.content.title}</h2>
                    <p>${textDef.content.description}</p>
                </div>
            `;
        }
    }

    positionShadowAnnotation() {
        console.log('Positioning shadow annotation');
        const endCapPosition = this.earthScene.earth.getShadowEndCapPosition();
        if (!endCapPosition) return;

        // Project 3D position to 2D screen coordinates
        const vector = endCapPosition.clone();
        vector.project(this.renderer.camera);
        
        // Convert to pixel coordinates
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

        // Position annotation and line
        const annotationsContainer = document.getElementById('annotations-container');
        annotationsContainer.innerHTML = `
            <div class="annotation">
                Area of intercepted Solar radiation: πR<sup>2</sup>
            </div>
        `;
    }

    updateAnnotationPosition() {
        if (!this.earthScene?.earth?.shadowEndCapPosition) {
            return;
        }

        const ANNOTATION_OFFSETS = {
            x: -250,  // pixels left of end cap center
            y: -150    // pixels above end cap center
        };

        const endCapWorldPosition = this.earthScene.earth.shadowEndCapPosition;
        const vector = endCapWorldPosition.clone();
        vector.project(this.renderer.camera);
        
        const endCapScreen = {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: -(vector.y * 0.5 - 0.5) * window.innerHeight
        };
        
        const annotation = document.querySelector('.annotation');
        if (annotation) {
            annotation.style.left = `${endCapScreen.x + ANNOTATION_OFFSETS.x}px`;
            annotation.style.top = `${endCapScreen.y + ANNOTATION_OFFSETS.y}px`;
        }
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.updateAnnotationPosition();
        });
    }

    resetToDefaultCamera(duration = 1000) {
        const startPosition = this.renderer.camera.position.clone();
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate position
            const newPosition = startPosition.clone().lerp(this.DEFAULT_CAMERA.position, eased);
            this.renderer.camera.position.copy(newPosition);
            this.renderer.camera.lookAt(this.DEFAULT_CAMERA.target);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    animateCamera(startPos, endPos, target, duration) {
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Smooth easing function
            const eased = 1 - Math.pow(1 - progress, 3);
            
            // Interpolate position
            const newPosition = startPos.clone().lerp(endPos, eased);
            this.renderer.camera.position.copy(newPosition);
            this.renderer.camera.lookAt(target);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
}