import * as THREE from 'three';

class ObjectRegistry {
    constructor() {
        this.definitions = new Map();
        this.setupDefaultObjects();
    }

    setupDefaultObjects() {
        // Earth - always visible, centered
        this.definitions.set('earth', {
            type: '3d',
            model: 'earth',
            position: {x: 0, y: 0, z: 0},
            isVisible: true,
            transitions: {
                enter: null,
                exit: null
            }
        });

        // Shadow cylinder with its annotation
        this.definitions.set('shadowCylinder', {
            type: '3d',
            model: 'shadowCylinder',
            isVisible: false,
            transitions: {
                enter: 'fade',
                exit: 'fade'
            }
        });

        // Shadow cylinder annotation
        this.definitions.set('shadowAnnotation', {
            type: 'annotation',
            content: "Area of intercepted Solar radiation: πR<sup>2</sup>",
            attachTo: 'shadowCylinder',
            position: 'endCap',
            transitions: {
                enter: 'fade',
                exit: 'fade'
            }
        });

        // Scene 1 text
        this.definitions.set('scene1Text', {
            type: 'text',
            content: {
                title: "Scene 1: Energy from the Sun",
                description: "Our planet intercepts a tiny fraction of the Sun's energy output. This incoming solar radiation, primarily in the form of visible light, is what keeps Earth warm."
            },
            transitions: {
                enter: 'slideUp',
                exit: 'slideUp'
            }
        });

        // Intro text
        this.definitions.set('introText', {
            type: 'text',
            content: {
                title: "Introduction",
                description: "Let's explore how Earth's temperature is regulated."
            },
            transitions: {
                enter: 'slideUp',
                exit: 'slideUp'
            }
        });
    }

    getDefinition(id) {
        return this.definitions.get(id);
    }
}

export { ObjectRegistry };
