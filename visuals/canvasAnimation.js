// Load images
const sprites = {
    blueGuyRight:    new Image(),
    greenGuyRight:   new Image(),
    redGuyRight:     new Image(),
    neutralGuyRight: new Image(),
    redGuyRightIso:  new Image(),

    blueGuyLeft:    new Image(),
    greenGuyLeft:   new Image(),
    redGuyLeft:     new Image(),
    neutralGuyLeft: new Image(),
    redGuyLeftIso:  new Image(),
}

sprites.blueGuyRight.src = './images/blue_sm_right.png';
sprites.blueGuyRight.width = 22;

sprites.greenGuyRight.src = './images/green_sm_right.png';
sprites.greenGuyRight.width = 22;

sprites.redGuyRight.src = './images/red_sm_right.png';
sprites.redGuyRight.width = 22;

sprites.redGuyRightIso.src = './images/red_sm_isolated_right.png';
sprites.redGuyRightIso.width = 22;

sprites.neutralGuyRight.src = './images/neutral_sm_right.png';
sprites.neutralGuyRight.width = 22;

sprites.blueGuyLeft.src = './images/blue_sm_left.png';
sprites.blueGuyLeft.width = 22;

sprites.greenGuyLeft.src = './images/green_sm_left.png';
sprites.greenGuyLeft.width = 22;

sprites.redGuyLeft.src = './images/red_sm_left.png';
sprites.redGuyLeft.width = 22;

sprites.redGuyLeftIso.src = './images/red_sm_isolated_left.png';
sprites.redGuyLeftIso.width = 22;

sprites.neutralGuyLeft.src = './images/neutral_sm_left.png';
sprites.neutralGuyLeft.width = 22;

/**
 * This class runs a visual simulation connected to the COVID simulation model, and renders
 * the output to the canvas DOM element passed in.
 */
class CanvasSimulation {

    /** Whether or not this visualization has started. */
    started = false;

    /** Whether or not this visualization is currently running. */
    running = false;

    /** How many animation frames equal 1 day of simulation. */
    dayFrameRate = 10;

    hooks = {
        onCollision: function() {},
        onInterval: function() {},
        onExposure: function() {}
    };

    constructor(wrapperElement, canvas, simulation, opts, hooks) {
        this.wrapperElement = wrapperElement;
        this.simulation = simulation;
        console.log('Building visualization for simulation:', this.simulation, hooks);

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

        this.frameCount = 0;

        // Set up event hooks
        if (hooks && hooks.onInterval) { this.hooks.onInterval = hooks.onInterval; }
        if (hooks && hooks.onCollision) { this.hooks.onCollision = hooks.onCollision; }

        // Add all the actors for this simulation
        const populationSize = simulation.simulationParameters.populationSize;
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

        // Ensure methods are bound to correct "this" context.
        this.runAnimation = this.runAnimation.bind(this);
        this.generateColor = this.generateColor.bind(this);
        this.generateColorSpectrum = this.generateColorSpectrum.bind(this);
    }
    
    /** Adds an atom to the scene. */
    add(datum){
        const d = datum || {};
        d.pos    = d.pos || this.center;
        d.radius = d.radius || 5;
        d.angle  = d.angle || 0;
        d.speed  = d.speed || 1;

        this.atoms.push(d);
        
        return this;
    }

    /**
     * Based on the actor's status, generates a solid color.
     * @param {Object} actor - the Actor to inspect.
     */
    generateColor(actor) {
        switch(actor.status) {
            case ACTOR_STATUS.EXPOSED: { return COLORS.YELLOW; }
            case ACTOR_STATUS.INFECTIOUS: { return COLORS.RED; }
            case ACTOR_STATUS.RECOVERED: { return COLORS.GREEN; }
            case ACTOR_STATUS.DECEASED: { return COLORS.NEUTRAL; }
            default: { return COLORS.BLUE; }
        }
    }

    /**
     * Based on the condition of the actor, returns the appropriate background color as a
     * (mostly) continuous spectrum.
     * @param {Object} actor - the Actor to inspect.
     */
    generateColorSpectrum(actor) {
        if (actor.status === ACTOR_STATUS.SUSCEPTIBLE) { return COLORS.BLUE; }
        if (actor.status === ACTOR_STATUS.RECOVERED) { return COLORS.GREEN; }
        if (actor.status === ACTOR_STATUS.DECEASED) { return COLORS.NEUTRAL; }
        
        // Actor is within the disease progression, generate spectrum of colors
        const infection = actor.myInfection;

        // If they're not Contagious yet, find out what % they are in the "daysToContagious"
        if (infection.duration() < infection.daysToContagious) {
            let colorIndex = Math.floor((infection.duration() / infection.daysToContagious) * COLOR_SPECTRUM.EXPOSED.length);
            if (colorIndex >= COLOR_SPECTRUM.EXPOSED.length) { colorIndex = COLOR_SPECTRUM.EXPOSED.length - 1; }
            return COLOR_SPECTRUM.EXPOSED[colorIndex];
        } else {
            let colorIndex = Math.floor(((infection.duration() - infection.daysToContagious) / 
            (infection.daysToNotContagious-infection.daysToContagious)) * COLOR_SPECTRUM.INFECTIOUS.length);
            if (colorIndex >= COLOR_SPECTRUM.INFECTIOUS.length) { colorIndex = COLOR_SPECTRUM.INFECTIOUS.length - 1; }
            return COLOR_SPECTRUM.INFECTIOUS[colorIndex];
        }

        // Fallback? Should we ever get here?
        return COLORS.BLUE; 
    }

    /**
     * Redraws the canvas with new actor positions and state.
     */
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
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
                this.ctx.fillStyle = this.generateColorSpectrum(this.simulation.actors[i]);
                this.ctx.fill();
            } else {
                // Which is the x direction?
                let actorSprite = sprites.blueGuyRight;
                if (d.angle > 90 && d.angle < 270) {
                    switch(this.simulation.actors[i].status) {
                        case ACTOR_STATUS.EXPOSED:
                        case ACTOR_STATUS.INFECTIOUS: {
                            if (this.simulation.actors[i].isolated) {
                                actorSprite = sprites.redGuyLeftIso;
                            } else {
                                actorSprite = sprites.redGuyLeft;
                            }
                            break;
                        }
                        case ACTOR_STATUS.RECOVERED: { actorSprite = sprites.greenGuyLeft; break; }
                        case ACTOR_STATUS.DECEASED: { actorSprite = sprites.neutralGuyLeft; break; }
                        default: { actorSprite = sprites.blueGuyLeft; }
                    }
                } else {
                    switch(this.simulation.actors[i].status) {
                        case ACTOR_STATUS.EXPOSED:
                        case ACTOR_STATUS.INFECTIOUS: {
                            if (this.simulation.actors[i].isolated) {
                                actorSprite = sprites.redGuyRightIso;
                            } else {
                                actorSprite = sprites.redGuyRight;
                            }
                            break;
                        }
                        case ACTOR_STATUS.RECOVERED: { actorSprite = sprites.greenGuyRight; break; }
                        case ACTOR_STATUS.DECEASED: { actorSprite = sprites.neutralGuyRight; break; }
                    }
                }
                this.ctx.drawImage(actorSprite, ...d.pos, 20, 27);
            }
        }
    }
    
    tick(){
        this.frameCount++;
        const numberOfAtoms = this.atoms.length;
        for (let i = 0; i < numberOfAtoms; i++){
            const atom = this.atoms[i];
            atom.collided = false;

            // Check through other nodes to detect collisions
            for (let j = 0; j < numberOfAtoms; j++){
                const atom0 = this.atoms[j];
                atom0.collided = false;

                // Collision!
                const atomShieldRadius = this.simulation.actors[i].isolated ? 4 : 0;
                const atom0ShieldRadius = this.simulation.actors[j].isolated ? 4 : 0;
                if (i !== j
                    && geometric.lineLength([atom.pos, atom0.pos]) < (atom.radius + atom0.radius + atomShieldRadius + atom0ShieldRadius)
                    && !atom.collided
                    && !atom0.collided
                ) {

                    // Call simulation model to check if there is a transmission...
                    const actor1 = this.simulation.actors[i];
                    const actor2 = this.simulation.actors[j];
                    // If either of the actors is infections, and neither are isolated, there is a
                    // possible transmission event.
                    if (actor1.status === ACTOR_STATUS.INFECTIOUS
                        && actor2.status === ACTOR_STATUS.SUSCEPTIBLE
                        && !actor1.isolated
                        && !actor2.isolated
                    ) {
                        actor2.infect();
                        this.hooks.onExposure();
                    } else if (actor2.status === ACTOR_STATUS.INFECTIOUS
                        && actor1.status === ACTOR_STATUS.SUSCEPTIBLE
                        && !actor1.isolated
                        && !actor2.isolated
                    ) {
                        actor1.infect();
                        this.hooks.onExposure();
                    }

                    // To avoid having them stick to each other,
                    // test if moving them in each other's angles will bring them closer or farther apart
                    // NOTE: Is this slow and unnecessary? Can we use a simpler function to handle "bounce"?
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

                    // Post collision event, call hook
                    this.hooks.onCollision(actor1, actor2);

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

        // Each frame of the animation = 1/20th (or config) of a day
        this.simulation.tickRapidTesting(1.0/this.dayFrameRate);
        this.simulation.tickDisease(1.0/this.dayFrameRate);

        // Each day that passes, call the onInterval hook
        if (this.frameCount % this.dayFrameRate === 0) {
            this.hooks.onInterval(this.simulation);
        }
    }

    /**
     * Begins the animation and starts the animation frame request.
     */
    runAnimation() {
        if (!this.running) { return; }
        this.animationFrame = requestAnimationFrame(this.runAnimation);

        this.tick();
        this.draw();
    }

    toggleActorDisplay() {
        if (this.actorType === 1) {
            this.actorType = 0;
        } else {
            this.actorType = 1;
        }
    }

    start() {
        if (!this.started && !this.running) {
            this.frameCount = 0;
            this.started = true;
            this.running = true;
            this.runAnimation();
        }
    }

    stop() {
        this.started = false;
        this.running = false;
        cancelAnimationFrame(this.animationFrame);
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    pause() {
        if (!this.started) { return; }
        this.running = false;
        cancelAnimationFrame(this.animationFrame);
    }

    resume() {
        if (this.started && !this.running) {
            this.running = true;
            this.runAnimation();
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
        this.frameCount = 0;
    }

}

/**
 * Extends the base animation to also collect and draw stats.
 */
class CanvasSimulationWithStats extends CanvasSimulation {

    constructor(wrapperElement, canvas, simulation, opts, hooks) {
        super(wrapperElement, canvas, simulation, opts, hooks);

        // Set up stat containers
        this.susceptibleNumberText = $(wrapperElement).find("#susceptibleNumber");
        this.infectedNumberText = $(wrapperElement).find("#infectedNumber");
        this.recoveredNumberText = $(wrapperElement).find("#recoveredNumber");
        this.deceasedNumberText = $(wrapperElement).find("#deceasedNumber");

        this.areaGraphElement = $(wrapperElement).find("#Simulation1-AreaGraph")[0];
        if (this.areaGraphElement) {
            this.areaGraph = new AreaGraph(this.areaGraphElement);
            this.areaGraph.init();
        }
    }

    tick() {
        super.tick();

        this.susceptibleNumberText.text(this.simulation.totals.susceptible);
        this.infectedNumberText.text(this.simulation.totals.infected);
        this.recoveredNumberText.text(this.simulation.totals.recovered);
        this.deceasedNumberText.text(this.simulation.totals.deceased);

        // Re-draw the line graph on 1/10th day intervals
        if (this.areaGraph) {
            this.areaGraph.draw(
                Math.floor(this.simulation.daysElapsed * 10),
                this.simulation.totals,
                this.simulation.simulationParameters.populationSize
            );
        }
    }

}

/**
 * Creates a new instance of CanvasSimulation and sets up tha canvas.
 * @param {DOM} canvas - A canvas DOM node which will render the data.
 * @param {Object} simulationOptions - A selection of initial options to use.
 * @param {*} [options] - Initialization options.
 * @returns A new instance of `CanvasSimulation`.
 */
const simulationFactory = (element, canvas, simulationOptions, options, hooks) => {
    const parameters = new SimulationParameters(simulationOptions);
    const simulation = new Simulation(parameters);
    const visualization = new CanvasSimulationWithStats(
        element,
        canvas,
        simulation,
        options,
        hooks
    );

    return visualization;
};

/**
 * Checks DOM elements for input and returns an updated options object.
 * @param {DOM} wrapper - The wrapper DOM element for the graphic.
 */
function loadOptions(wrapper) {
    const options = {};
    const populationSize = parseInt($(wrapper).find('input[name=populationSize').val(), 10);
    if (populationSize) { options.populationSize = populationSize; }
    const startingInfectionRate = parseInt($(wrapper).find('input[name=startingInfectionRate').val(), 10) / 100;
    if (startingInfectionRate) { options.startingInfectionRate = startingInfectionRate; }
    const testingInterval = parseFloat($(wrapper).find('input[name=testingInterval').val());
    if (testingInterval) { options.testingInterval = testingInterval; }
    const testingRate = parseFloat($(wrapper).find('input[name=testingRate').val()) / 100;
    console.log("TESTING RATE:" + testingRate);
    options.testingRate = testingRate;
    options.selfIsolationRate = 0;
    return options;
}

/**
 * Creates a new simulation within the given wrapper and connects UI controls to
 * this animation.
 * @param {string} elementId - The ID of the wrapper element for this animation.
 * @param {Object} [simulationOptions] - An object containing a subset of simulation options.
 * @param {Object} [visualOptions] - An object containing visualization options.
 * @returns A reference to the `CanvasSimulation` instance created.
 * TODO: Use a global KV pair to hold the simulation (key = elementId value = simulation).
 * TODO: Enforce only one simulation per element so no weird behavior when reset hit numerous times. Reset should stop and clear first.
 */
function makeCanvasAnimation(
    elementId,
    simulationOptions = {},
    visualOptions = {},
    hooks = {}
) {
    const wrapper = document.getElementById(elementId);
    const graphic = document.getElementById(`${elementId}-Graphic`);
    const canvas = document.createElement('canvas');
    graphic.appendChild(canvas);

    // Style the canvas
    canvas.width = graphic.clientWidth;
    canvas.height = graphic.clientHeight;
    canvas.style.background = 'white';
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //TODO: BUG!
    let mySimulation;

    // Set up controls
    $(wrapper).find('.controls .btn-start').click(function() {
        if (mySimulation) {
            mySimulation.stop();
        }
        mySimulation = simulationFactory(
            wrapper,
            canvas,
            { ...simulationOptions, ...loadOptions(wrapper) },
            { ...visualOptions, width: graphic.clientWidth, height: graphic.clientHeight },
            hooks
        );
        mySimulation.start();
    });
    $(wrapper).find('.controls .btn-pause').click(function() { 
        if (mySimulation) {
            mySimulation.toggle(); 
        }
    });
    $(wrapper).find('.controls .btn-reset').click(function() {
        if (mySimulation) {
            mySimulation.stop();
        }
        // mySimulation = simulationFactory(
        //     wrapper,
        //     canvas,
        //     { ...simulationOptions, ...loadOptions(wrapper) },
        //     { ...visualOptions, width: graphic.clientWidth, height: graphic.clientHeight },
        //     hooks
        // );
        // mySimulation.start();
    });
    $(wrapper).find('.controls .btn-toggleActor').click(function() { mySimulation.toggleActorDisplay(); });

    return mySimulation;
    
}
