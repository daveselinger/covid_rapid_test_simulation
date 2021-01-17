// Load images
const blueGuy = new Image();
blueGuy.src = './images/blue_xs.png';
blueGuy.width = 10;

const redGuy = new Image();
redGuy.src = './images/red_small.png';
redGuy.width = 10;

class CanvasSimulation {

    constructor(canvas, opts, simulation){
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d', { alpha: false });
        this.width  = opts && opts.width ? opts.width : 600;
        this.height = opts && opts.height ? opts.height : 400;
        this.center = [this.width / 2, this.height / 2];
        this.atoms  = [];

        this.imageType = 0;

        // Ensure methods are bound
        this.runCanvasAnimation = this.runCanvasAnimation.bind(this);
    }
    
    add(datum){
        const d = datum || {};
        d.pos    = d.pos || this.center;
        d.radius = d.radius || 5;
        d.angle  = d.angle || 0;
        d.speed  = d.speed || 1;

        this.atoms.push(d);
        
        return this;
    }
    
    tick(){
        for (let i = 0; i < this.atoms.length; i++){
            const atom = this.atoms[i];
            atom.collided = false;

            // Check through other nodes to detect collisions
            for (let j = 0; j < this.atoms.length; j++){
                const atom0 = this.atoms[j];
                atom0.collided = false;

                // Collision!
                if (i !== j && geometric.lineLength([atom.pos, atom0.pos]) < atom.radius + atom0.radius && !atom.collided && !atom0.collided){
                    
                    // To avoid having them stick to each other,
                    // test if moving them in each other's angles will bring them closer or farther apart
                    const keep = geometric.lineLength([
                        geometric.pointTranslate(atom.pos, atom.angle, atom.speed),
                        geometric.pointTranslate(atom0.pos, atom0.angle, atom0.speed)
                    ]);
                    const swap = geometric.lineLength([
                        geometric.pointTranslate(atom.pos, atom0.angle, atom0.speed),
                        geometric.pointTranslate(atom0.pos, atom.angle, atom.speed)
                    ]);

                    if (keep < swap) {
                        const newAngle = atom.angle;
                        const newSpeed = atom.speed;
                        atom.angle     = atom0.angle;
                        atom.speed     = atom0.speed;
                        atom0.angle    = newAngle;
                        atom0.speed    = newSpeed;
                        atom.collided  = true;
                        atom0.collided = true;
                    }

                    break;
                }
            }

            // Detect sides
            const wallVertical   = (atom.pos[0] <= atom.radius || atom.pos[0] >= this.width - atom.radius);
            const wallHorizontal = (atom.pos[1] <= atom.radius || atom.pos[1] >= this.height - atom.radius);

            if (wallVertical || wallHorizontal) {
                // Is it moving more towards the middle or away from it?
                const t0 = geometric.pointTranslate(atom.pos, atom.angle, atom.speed);
                const l0 = geometric.lineLength([this.center, t0]);

                const reflected = geometric.angleReflect(atom.angle, wallVertical ? 90 : 0);
                const t1 = geometric.pointTranslate(atom.pos, reflected, atom.speed);
                const l1 = geometric.lineLength([this.center, t1]);

                if (l1 < l0) { atom.angle = reflected; }
            }

            atom.pos = geometric.pointTranslate(atom.pos, atom.angle, atom.speed);
        }
    }

    /**
     * Begins the animation and starts the animation frame request.
     */
    runCanvasAnimation() {
        requestAnimationFrame(this.runCanvasAnimation);
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = COLORS.BLUE;

        // The simulation.tick method advances the simulation one tick
        this.tick();

        // Re-draw all the actors
        for (let i = 0, l = this.atoms.length; i < l; i++){
            const d = this.atoms[i];
            if (this.imageType === 0) {
                this.ctx.beginPath();
                this.ctx.arc(...d.pos, d.radius, 0, 2 * Math.PI);
                this.ctx.fill();
            } else {
                this.ctx.drawImage(blueGuy, ...d.pos, 20, 27);
            }
        }
    }

}

/**
 * Returns a new instance of CanvasSimulation.
 * @param {*} canvas - A canvas DOM node which will render the data.
 * @param {Object} simulation - A canvas DOM node which will render the data.
 * @param {*} [options] - Initialization options.
 */
const simulationFactory = (canvas, simulation, options) => {
    const visualization = new CanvasSimulation(canvas, simulation, options);

    // Style the canvas
    canvas.width = visualization.width;
    canvas.height = visualization.height;
    canvas.style.background = "white";

    for (let i = 0; i < 200; i++){
        const radius = 5;

        // Add actor
        visualization.add({
            speed: between(1, 3),
            angle: between(0, 360),
            pos: [
                between(radius, visualization.width - radius),
                between(radius, visualization.height - radius)
            ],
            radius
        });
    }

    return visualization;
};

function makeCanvasAnimation(elementId) {
    const wrapper = document.getElementById(elementId);
    const canvas = document.createElement("canvas");
    const mySimulation = simulationFactory(canvas, { width: wrapper.clientWidth, height: wrapper.clientHeight });
    wrapper.appendChild(canvas);

    mySimulation.runCanvasAnimation(mySimulation);
}
