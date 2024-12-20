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

        // Add Scene 2 text
        this.definitions.set('scene2Text', {
            type: 'text',
            content: {
                title: "Scene 2: Outgoing Energy",
                description: "Earth's surface emits infrared radiation. This is how our planet loses heat to space."
            },
            transitions: {
                enter: 'slideUp',
                exit: 'slideUp'
            }
        });

        // Add IR Arrows annotation
        this.definitions.set('irArrowsAnnotation', {
            type: 'annotation',
            content: "Infrared radiation is emitted in all directions from Earth's surface",
            attachTo: 'irArrows',
            position: 'center',
            transitions: {
                enter: 'fade',
                exit: 'fade'
            }
        });
    }

    getDefinition(id) {
        return this.definitions.get(id);
    }
}

export { ObjectRegistry };
