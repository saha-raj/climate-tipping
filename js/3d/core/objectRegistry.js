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

        // Shadow cylinder
        this.definitions.set('shadowCylinder', {
            type: '3d',
            model: 'shadowCylinder',
            isVisible: false,
            transitions: {
                enter: 'fade',
                exit: 'fade'
            },
            annotations: ['shadowEndCap']
        });

        // Scene 1 text
        this.definitions.set('scene1Text', {
            type: 'text',
            content: {
                title: "Scene 1: Energy from the Sun",
                description: "Our planet intercepts a tiny fraction of the Sun's energy output..."
            },
            position: {
                start: 0,
                final: -100  // pixels to scroll up
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
