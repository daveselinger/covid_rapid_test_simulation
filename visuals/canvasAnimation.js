
class CanvasSimulation {

    constructor(opts){
        this.width = opts && opts.width ? opts.width : 600;
        this.height = opts && opts.height ? opts.height : 400;
        this.center = [this.width / 2, this.height / 2];
        this.atoms = [];
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
            const d = this.atoms[i];
            d.collided = false;

            // Check through other nodes to detect collisions
            for (let i0 = 0; i0 < this.atoms.length; i0++){
                const d0 = this.atoms[i0];
                d0.collided = false;

                // Collision!
                if (i !== i0 && geometric.lineLength([d.pos, d0.pos]) < d.radius + d0.radius && !d.collided && !d0.collided){
                    
                    // To avoid having them stick to each other,
                    // test if moving them in each other's angles will bring them closer or farther apart
                    const keep = geometric.lineLength([
                        geometric.pointTranslate(d.pos, d.angle, d.speed),
                        geometric.pointTranslate(d0.pos, d0.angle, d0.speed)
                    ]),
                    swap = geometric.lineLength([
                        geometric.pointTranslate(d.pos, d0.angle, d0.speed),
                        geometric.pointTranslate(d0.pos, d.angle, d.speed)
                    ]);

                    if (keep < swap) {
                        const dc = JSON.parse(JSON.stringify(d));
                        d.angle     = d0.angle;
                        d.speed     = d0.speed;
                        d0.angle    = dc.angle;
                        d0.speed    = dc.speed;
                        d.collided  = true;
                        d0.collided = true;
                    }

                    break;
                }
            }

            // Detect sides
            const wallVertical   = (d.pos[0] <= d.radius || d.pos[0] >= this.width - d.radius);
            const wallHorizontal = (d.pos[1] <= d.radius || d.pos[1] >= this.height - d.radius);

            if (wallVertical || wallHorizontal) {
                // Is it moving more towards the middle or away from it?
                const t0 = geometric.pointTranslate(d.pos, d.angle, d.speed);
                const l0 = geometric.lineLength([this.center, t0]);

                const reflected = geometric.angleReflect(d.angle, wallVertical ? 90 : 0);
                const t1 = geometric.pointTranslate(d.pos, reflected, d.speed);
                const l1 = geometric.lineLength([this.center, t1]);

                if (l1 < l0) { d.angle = reflected; }
            }

            d.pos = geometric.pointTranslate(d.pos, d.angle, d.speed);
        }
    }
}

/**
 * Returns a new instance of CanvasSimulation.
 * @param {*} [options] - Initialization options.
 */
const simulationFactory = (options) => {
    const simulation = new CanvasSimulation(options);

    // We'll create 100 circles of random radii, moving in random directions at random speeds.
    for (let i = 0; i < 100; i++){
        const radius = 5; // d3.randomUniform(4, 10)();
        
        // Add a circle to your simulation with simulation.add
        simulation.add({
            speed: between(1, 3),
            angle: between(0, 360),
            pos: [
                between(radius, simulation.width - radius),
                between(radius, simulation.height - radius)
            ],
            radius
        });
    }
    return simulation;
};

// Draw the simulation
const wrapper = document.getElementById("Simulation1");
const canvas = document.createElement("canvas");
const mySimulation = simulationFactory({ width: wrapper.clientWidth, height: wrapper.clientHeight });
canvas.width = mySimulation.width;
canvas.height = mySimulation.height;
canvas.style.background = "white";
wrapper.appendChild(canvas);
const ctx = canvas.getContext("2d");
ctx.fillStyle = COLORS.BLUE;
// ctx.strokeStyle = "blue";

function startCanvasAnimation() {
    requestAnimationFrame(startCanvasAnimation);
    ctx.clearRect(0, 0, mySimulation.width, mySimulation.height);

    // The simulation.tick method advances the simulation one tick
    mySimulation.tick();
    for (let i = 0, l = mySimulation.atoms.length; i < l; i++){
        const d = mySimulation.atoms[i];
        ctx.beginPath();
        ctx.arc(...d.pos, d.radius, 0, 2 * Math.PI);
        ctx.fill();   
    }
}
