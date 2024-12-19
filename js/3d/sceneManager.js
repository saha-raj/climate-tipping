export class SceneManager {
    constructor({ renderer, earthScene }) {
        this.renderer = renderer;
        this.camera = renderer.camera;  // Store camera reference
        this.earthScene = earthScene;
        
        // Force scroll to top on page load/refresh
        window.history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
        
        this.currentScene = 1;
        this.currentState = 0;  // Track state within scene
        
        this.scenes = [
            null,
            {
                title: "Scene 1: Energy from the Sun",
                description: "Our planet intercepts a tiny fraction of the Sun's energy output. This incoming solar radiation, primarily in the form of visible light, is what keeps Earth warm.",
                states: [
                    {
                        threshold: 0.1,
                        setup: () => {
                            this.updateText();
                        }
                    }
                ],
                exitThreshold: 0.3
            },
            {
                title: "Scene 2: Earth's Shadow",
                description: "The Earth casts a cylindrical shadow, blocking sunlight from reaching the space behind it.",
                states: [
                    {
                        threshold: 0.3,
                        setup: () => {
                            this.updateText();
                            this.earthScene.earth.createShadowCone();
                            document.getElementById('annotations-container').innerHTML = '';
                        }
                    },
                    {
                        threshold: 0.4,
                        setup: () => {
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
                exitThreshold: 0.5
            }
        ];

        // Add debounce to reduce jitter
        this.scrollTimeout = null;
        this.setupScrollHandler();
        this.scenes[1].states[0].setup();
    }

    setupScrollHandler() {
        window.addEventListener('scroll', () => {
            // Debounce the scroll handling
            if (this.scrollTimeout) {
                window.cancelAnimationFrame(this.scrollTimeout);
            }

            this.scrollTimeout = window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                const windowHeight = window.innerHeight;
                const scrollFraction = scrollY / windowHeight;
                
                const currentSceneData = this.scenes[this.currentScene];
                
                // Check for state transitions within current scene
                currentSceneData.states.forEach((state, index) => {
                    if (scrollFraction >= state.threshold && this.currentState < index) {
                        console.log(`Transitioning to state ${index} in scene ${this.currentScene}`);
                        this.currentState = index;
                        state.setup();
                    }
                });
                
                // Scene transitions
                if (scrollFraction >= currentSceneData.exitThreshold && 
                    this.currentState >= currentSceneData.states.length - 1) {
                    this.transitionToScene(this.currentScene + 1);
                } else if (scrollFraction < currentSceneData.exitThreshold && this.currentScene > 1) {
                    this.transitionToScene(this.currentScene - 1);
                }
                
                // Smooth text movement
                const textElement = document.querySelector('.scene-text');
                if (textElement) {
                    if (scrollFraction < currentSceneData.exitThreshold) {
                        textElement.style.transform = `translateY(${-scrollY}px)`;
                    } else {
                        textElement.style.transform = 'translateY(0)';
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
        if (this.currentScene !== 2 || !this.earthScene.earth.shadowEndCap) return;

        const worldPosition = this.earthScene.earth.getShadowEndCapWorldPosition();
        const screenPosition = worldPosition.clone().project(this.camera);
        
        // Convert to pixel coordinates (center of end cap)
        const x = (screenPosition.x + 1) * window.innerWidth / 2;
        const y = (-screenPosition.y + 1) * window.innerHeight / 2;

        const annotation = document.querySelector('.shadow-annotation');
        const line = document.querySelector('.annotation-line');
        
        if (annotation && line) {
            // Position annotation relative to end cap center
            const verticalOffset = -180;    // pixels up from end cap center
            const horizontalOffset = -150;    // pixels right from end cap center
            
            annotation.style.left = `${x + horizontalOffset}px`;
            annotation.style.top = `${y + verticalOffset}px`;

            // Get annotation box dimensions
            const annotationRect = annotation.getBoundingClientRect();
            const annotationBottom = annotationRect.bottom;
            const annotationCenterX = annotationRect.left + (annotationRect.width / 2);

            // Line starts at end cap center
            line.style.left = `${x}px`;
            line.style.top = `${y}px`;
            
            // Calculate length and angle from end cap center to annotation bottom center
            const dx = annotationCenterX - x;
            const dy = annotationBottom - y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            
            line.style.transform = `rotate(${angle}deg)`;
            line.style.width = `${length}px`;
        }
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.updateAnnotationPosition();
        });
    }
}