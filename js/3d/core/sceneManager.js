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
                                <div class="shadow-annotation">
                                    ${annotDef.content}
                                </div>
                                <div class="annotation-line"></div>
                            `;
                            this.updateAnnotationPosition();
                        }
                    }
                ],
                exitThreshold: 0.7
            },
            {
                objects: ['earth', 'shadowCylinder', 'irArrows', 'scene2Text'],
                states: [
                    {
                        threshold: 0.7,
                        setup: () => {
                            this.resetToDefaultCamera();
                            this.updateText();
                            this.earthScene.earth.createIRArrows();
                            
                            // Get annotation content from registry
                            const annotDef = this.objectRegistry.getDefinition('irArrowsAnnotation');
                            const annotationsContainer = document.getElementById('annotations-container');
                            annotationsContainer.innerHTML = `
                                <div class="shadow-annotation">
                                    ${annotDef.content}
                                </div>
                            `;
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
                    
                    // Clear current scene's objects
                    this.clearSceneObjects(currentSceneData);
                    
                    // Go to previous scene's initial state
                    this.currentScene--;
                    this.currentState = 0;
                    this.scenes[this.currentScene].states[0].setup();
                    
                } else {
                    // Forward scrolling remains the same
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
        // Clear shadow cylinder if it exists
        if (this.earthScene.earth.shadowGroup) {
            this.earthScene.earth.remove(this.earthScene.earth.shadowGroup);
            this.earthScene.earth.shadowGroup = null;
        }
        
        // Clear IR arrows if they exist
        if (this.earthScene.earth.irArrows) {
            this.earthScene.earth.remove(this.earthScene.earth.irArrows);
            this.earthScene.earth.irArrows = null;
        }
        
        // Clear annotations
        document.getElementById('annotations-container').innerHTML = '';
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
            <div class="shadow-annotation">
                Area of intercepted Solar radiation: πR<sup>2</sup>
            </div>
            <div class="annotation-line"></div>
        `;
    }

    updateAnnotationPosition() {
        if (!this.earthScene?.earth?.shadowEndCapPosition) {
            return;
        }

        // Offset constants relative to end cap center
        const ANNOTATION_OFFSETS = {
            x: -250,  // pixels left of end cap center
            y: -150    // pixels above end cap center
        };

        // Get end cap position in world space
        const endCapWorldPosition = this.earthScene.earth.shadowEndCapPosition;
        const vector = endCapWorldPosition.clone();
        vector.project(this.renderer.camera);
        
        // Convert end cap position to screen coordinates
        const endCapScreen = {
            x: (vector.x * 0.5 + 0.5) * window.innerWidth,
            y: -(vector.y * 0.5 - 0.5) * window.innerHeight
        };
        
        // Position annotation box relative to end cap
        const annotation = document.querySelector('.shadow-annotation');
        if (annotation) {
            annotation.style.left = `${endCapScreen.x + ANNOTATION_OFFSETS.x}px`;  // Place text box left of end cap
            annotation.style.top = `${endCapScreen.y + ANNOTATION_OFFSETS.y}px`;   // Place text box above end cap
        }
        
        // Position connecting line from end cap to annotation
        const line = document.querySelector('.annotation-line');
        if (line) {
            // Line starts at end cap center
            line.style.left = `${endCapScreen.x}px`;
            line.style.top = `${endCapScreen.y}px`;
            
            const textBox = document.querySelector('.shadow-annotation');
            if (textBox) {
                const textRect = textBox.getBoundingClientRect();
                // Calculate angle between end cap and text box bottom-right corner
                const angle = Math.atan2(
                    textRect.bottom - endCapScreen.y,
                    textRect.right - endCapScreen.x
                );
                line.style.transform = `rotate(${angle}rad)`;
                // Line length = distance from end cap to text box
                line.style.width = `${Math.hypot(
                    textRect.right - endCapScreen.x,
                    textRect.bottom - endCapScreen.y
                )}px`;
            }
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
}