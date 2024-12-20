import { ObjectRegistry } from './objectRegistry.js';

export class SceneManager {
    TEXT_POSITION = {
        top: '20%',
        left: '3rem',
        maxWidth: '400px'
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
                title: "Introduction",
                description: "Let's explore how Earth's temperature is regulated.",
                objects: ['earth'],
                states: [{
                    threshold: 0,
                    setup: () => this.updateText()
                }],
                exitThreshold: 0.1
            },
            {
                title: "Scene 1: Energy from the Sun",
                description: "Our planet intercepts a tiny fraction of the Sun's energy output. This incoming solar radiation, primarily in the form of visible light, is what keeps Earth warm.",
                objects: ['earth', 'shadowCylinder', 'scene1Text'],
                states: [
                    {
                        threshold: 0.1,
                        setup: () => {
                            this.updateText();
                        }
                    },
                    {
                        threshold: 0.3,
                        setup: () => {
                            this.earthScene.earth.createShadowCone();
                            const annotationsContainer = document.getElementById('annotations-container');
                            annotationsContainer.innerHTML = `
                                <div class="shadow-annotation">
                                    Area of intercepted Solar radiation: πR<sup>2</sup>
                                </div>
                                <div class="annotation-line"></div>
                            `;
                            this.updateAnnotationPosition();
                        }
                    }
                ],
                exitThreshold: 0.7
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
                
                // Handle scene transitions
                if (scrollFraction < this.scenes[this.currentScene].states[0].threshold && 
                    this.currentScene > 0) {
                    // Going backwards to previous scene
                    this.currentScene--;
                    this.currentState = 0;
                    this.scenes[this.currentScene].states[0].setup();
                } else {
                    // Going forwards
                    const currentSceneData = this.scenes[this.currentScene];
                    
                    // Handle state transitions within current scene
                    currentSceneData.states.forEach((state, index) => {
                        if (scrollFraction >= state.threshold && this.currentState < index) {
                            this.currentState = index;
                            state.setup();
                        }
                    });

                    // Forward scene transition
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

    transitionToScene(newIndex) {
        if (newIndex !== this.currentScene && newIndex >= 1 && newIndex < this.scenes.length) {
            console.log(`Transitioning to scene ${newIndex}`);
            this.currentScene = newIndex;
            this.currentState = 0;  // Reset state counter
            this.scenes[newIndex].states[0].setup();
        }
    }

    updateText() {
        console.log('Updating text for scene:', this.currentScene);
        const scene = this.scenes[this.currentScene];
        
        // Update main scene text
        const textOverlay = document.getElementById('text-overlay');
        textOverlay.innerHTML = `
            <div class="scene-text">
                <h2>${scene.title}</h2>
                <p>${scene.description}</p>
            </div>
        `;

        // Update annotations - only show in Scene 2
        const annotationsContainer = document.getElementById('annotations-container');
        annotationsContainer.innerHTML = this.currentScene === 2 ? `
            <div class="shadow-annotation">
                Area of intercepted Solar radiation: πR<sup>2</sup>
            </div>
            <div class="annotation-line"></div>
        ` : '';
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
}