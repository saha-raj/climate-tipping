export class SceneManager {
    constructor({ renderer, earthScene }) {
        this.renderer = renderer;
        this.earthScene = earthScene;
        
        // Force scroll to top on page load/refresh
        window.history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);
        
        // Clear any existing elements
        this.clearAllElements();
        
        this.currentScene = 1;
        this.scenes = [
            null,  // Empty first element so array indices match scene numbers
            {
                title: "Scene 1: Energy from the Sun",
                description: "Our planet intercepts a tiny fraction of the Sun's energy output. This incoming solar radiation, primarily in the form of visible light, is what keeps Earth warm.",
                setup: () => {
                    // Clear any existing annotations when entering Scene 1
                    const annotationsContainer = document.getElementById('annotations-container');
                    if (annotationsContainer) {
                        annotationsContainer.innerHTML = '';
                    }
                }
            },
            {
                title: "Scene 2: Earth's Shadow",
                description: "The Earth casts a cylindrical shadow, blocking sunlight from reaching the space behind it.",
                setup: () => {
                    this.earthScene.earth.createShadowCone();
                    this.positionShadowAnnotation();
                }
            }
        ];

        // Initialize Scene 1
        this.setupScrollHandler();
        this.scenes[1].setup();
        this.updateText();
    }

    clearAllElements() {
        // Clear annotations
        document.getElementById('annotations-container').innerHTML = '';
        
        // Clear any shadow cylinder
        if (this.earthScene.earth.shadowGroup) {
            this.earthScene.earth.remove(this.earthScene.earth.shadowGroup);
            this.earthScene.earth.shadowGroup = null;
        }
    }

    setupScrollHandler() {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            const threshold = window.innerHeight * 0.3;
            
            console.log('Scroll position:', scrollY, 'Threshold:', threshold);

            if (this.currentScene === 1) {
                const textElement = document.querySelector('.scene-text');
                if (scrollY <= threshold) {
                    // Scene 1 text moves up with scroll
                    textElement.style.transform = `translateY(${-scrollY}px)`;
                } else if (scrollY > threshold) {
                    // Transition to Scene 2
                    this.transitionToScene(2);
                }
            } else if (this.currentScene === 2) {
                const textElement = document.querySelector('.scene-text');
                if (scrollY <= threshold) {
                    // Transition back to Scene 1
                    this.transitionToScene(1);
                } else {
                    // Scene 2 text stays fixed until next threshold
                    textElement.style.transform = 'translateY(0)';
                }
            }
        });
    }

    transitionToScene(newIndex) {
        if (newIndex !== this.currentScene && newIndex >= 1 && newIndex < this.scenes.length) {
            console.log(`Transitioning to scene ${newIndex}`);
            this.currentScene = newIndex;
            this.scenes[newIndex].setup();
            this.updateText();
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
}