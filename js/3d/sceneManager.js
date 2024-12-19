export class SceneManager {
    constructor(earthScene) {
        this.earthScene = earthScene;
        this.currentScene = 0;
        this.scenes = [
            {
                title: "Scene 1: Energy from the Sun",
                description: "Our planet intercepts a tiny fraction of the Sun's energy output. This incoming solar radiation, primarily in the form of visible light, is what keeps Earth warm.",
                setup: () => {
                    // Basic Earth is already set up
                }
            },
            {
                title: "Scene 2: Earth's Shadow",
                description: "The Earth casts a cylindrical shadow, blocking sunlight from reaching the space behind it.",
                setup: () => {
                    this.earthScene.earth.createShadowCone();
                }
            }
        ];

        this.setupScrollHandler();
        this.updateText();
    }

    setupScrollHandler() {
        window.addEventListener('scroll', () => {
            const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
            const sceneIndex = Math.floor(scrollPercent * this.scenes.length);
            
            if (sceneIndex !== this.currentScene) {
                this.transitionToScene(sceneIndex);
            }
        });
    }

    transitionToScene(newIndex) {
        if (newIndex >= 0 && newIndex < this.scenes.length) {
            // Get current and new text elements
            const currentText = document.querySelector('.scene-text');
            
            // Fade out current text upward
            currentText.classList.add('exit');
            
            // After current text starts moving up
            setTimeout(() => {
                // Update content but start it below
                this.currentScene = newIndex;
                this.scenes[newIndex].setup();
                this.updateText();
                
                const newText = document.querySelector('.scene-text');
                newText.classList.add('enter');
                
                // Force a reflow
                newText.offsetHeight;
                
                // Animate new text up into place
                newText.classList.remove('enter');
            }, 400);  // Adjust timing as needed
        }
    }

    updateText() {
        const scene = this.scenes[this.currentScene];
        const textOverlay = document.getElementById('text-overlay');
        textOverlay.innerHTML = `
            <div class="scene-text">
                <h2>${scene.title}</h2>
                <p>${scene.description}</p>
            </div>
        `;
    }
}