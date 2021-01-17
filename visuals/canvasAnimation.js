// Load images
const blueGuy = new Image();
blueGuy.src = './images/blue_xs.png';
blueGuy.width = 10;

const redGuy = new Image();
redGuy.src = './images/red_sm.png';
redGuy.width = 10;

class CanvasSimulation {

    /** Whether or not this visualization has started. */
    started = false;

    /** Whether or not this visualization is currently running. */
    running = false;

    constructor(canvas, simulation, opts){
        this.simulation = simulation;
        console.log('Building visualization for simulation:', this.simulation);

        // Set up canvas
        this.canvas = canvas;
        this.ctx    = canvas.getContext('2d', { alpha: false });
        this.width  = opts && opts.width ? opts.width : 600;
        this.height = opts && opts.height ? opts.height : 400;
        this.center = [this.width / 2, this.height / 2];
        this.atoms  = [];
        this.actorType = opts && opts.actorType
            ? (opts.actorType === 'guy' ? 1 : 0)
            : 0;

        // Add all the actors for this simulation
        const populationSize = simulation.config.populationSize;
        for (let i = 0; i < populationSize; i++){
            const radius = 5;
    
            // Add actor
            this.add({
                speed: between(1, 3),
                angle: between(0, 360),
                pos: [
                    between(radius, this.width - radius),
                    between(radius, this.height - radius)
                ],
                radius
            });
        }

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

                    // TODO: Call interaction method in simulation


                    // To avoid having them stick to each other,
                    // test if moving them in each other's angles will bring them closer or farther apart
                    // NOTE: Is this slow and unnecessary?
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

            // Only translate the actor's position if they're moving (e.g. not deceased and not isolating).
            const actorStatus = this.simulation.actors[i].status;
            const isActorIsolated = this.simulation.actors[i].isolated;
            if (actorStatus !== ACTOR_STATUS.DECEASED
                && (!isActorIsolated)
            ) {
                atom.pos = geometric.pointTranslate(atom.pos, atom.angle, atom.speed);
            }
        }

        this.simulation.tick();
    }

    /**
     * Begins the animation and starts the animation frame request.
     */
    runCanvasAnimation() {
        if (!this.running) { return; }
        requestAnimationFrame(this.runCanvasAnimation);
        this.ctx.clearRect(0, 0, this.width, this.height);

        // The simulation.tick method advances the simulation one tick
        this.tick();

        // Re-draw all the actors
        for (let i = 0, l = this.atoms.length; i < l; i++){
            const d = this.atoms[i];
            if (this.actorType === 0) {
                // Is this actor isolating? If so, draw with shield around them.
                if (this.simulation.actors[i].isolated) {
                    this.ctx.fillStyle = COLORS.LIGHT;
                    this.ctx.beginPath();
                    this.ctx.arc(...d.pos, d.radius + 4, 0, 2 * Math.PI);
                    this.ctx.fill();
                }

                // Draw main actor dot with appropriate color
                this.ctx.beginPath();
                this.ctx.arc(...d.pos, d.radius, 0, 2 * Math.PI);
                switch(this.simulation.actors[i].status) {
                    case ACTOR_STATUS.EXPOSED:
                    case ACTOR_STATUS.INFECTIOUS: { this.ctx.fillStyle = COLORS.RED; break; }
                    case ACTOR_STATUS.RECOVERED: { this.ctx.fillStyle = COLORS.GREEN; break; }
                    case ACTOR_STATUS.DECEASED: { this.ctx.fillStyle = COLORS.DARK; break; }
                    default: { this.ctx.fillStyle = COLORS.BLUE; }
                }
                this.ctx.fill();
            } else {
                this.ctx.drawImage(blueGuy, ...d.pos, 20, 27);
            }
        }
    }

    start() {
        if (!this.started && !this.running) {
            this.started = true;
            this.running = true;
            this.runCanvasAnimation();
        }
    }

    pause() {
        if (!this.started) { return; }
        this.running = false;
    }

    resume() {
        if (this.started && !this.running) {
            this.running = true;
            this.runCanvasAnimation();
        }
    }

    toggle() {
        if (!this.started) { return; }
        if (this.running) {
            this.pause();
        } else {
            this.resume();
        }
        
    }

    reset() {
        // TODO: not yet implemented
    }

}

/**
 * Returns a new instance of CanvasSimulation.
 * @param {*} canvas - A canvas DOM node which will render the data.
 * @param {Object} simulation - A canvas DOM node which will render the data.
 * @param {*} [options] - Initialization options.
 */
const simulationFactory = (canvas, simulation, options) => {
    const visualization = new CanvasSimulation(
        canvas,
        simulation,
        options
    );

    // Style the canvas
    canvas.width = visualization.width;
    canvas.height = visualization.height;
    canvas.style.background = 'white';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return visualization;
};

/**
 * Creates a new simulation within the given wrapper and connects UI controls to
 * this animation.
 * @param {string} elementId - The ID of the wrapper element for this animation.
 * @param {Object} [simulationOptions] - An object containing a subset of simulation options.
 * @param {Object} [visualOptions] - An object containing visualization options.
 */
function makeCanvasAnimation(elementId, simulationOptions = {}, visualOptions = {}) {
    const wrapper = document.getElementById(elementId);
    const graphic = document.getElementById(`${elementId}-Graphic`);
    const canvas = document.createElement('canvas');
    graphic.appendChild(canvas);

    const parameters = new SimulationParameters(simulationOptions);
    const simulation = new Simulation(parameters);

    let mySimulation = simulationFactory(
        canvas,
        simulation,
        { ...visualOptions, width: graphic.clientWidth, height: graphic.clientHeight }
    );

    // Set up controls
    $(wrapper).find('.controls .btn-start').click(function() { mySimulation.start(); });
    $(wrapper).find('.controls .btn-pause').click(function() { mySimulation.toggle(); });
    $(wrapper).find('.controls .btn-reset').click(function() {
        mySimulation = simulationFactory(
            canvas,
            simulation,
            { ...visualOptions, width: graphic.clientWidth, height: graphic.clientHeight }
        );
        mySimulation.start();
    });
    
}
