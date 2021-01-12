/**
 * Pseudo-code implementation of the widget to run the simulation.
 */

const {
    SimulationParameters,
    ACTOR_STATUS,
    Actor,
    Simulation
} = require('./lib/simulation')

/**
 * A helper utility to add a delay to the execution.
 * @param {number} ms - The number of milliseconds to pause.
 */
const pause = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main execution loop for the simulation.
 */
async function runSimulation() {
    const parameters = new SimulationParameters()
    console.log('Setting up simulation with parameters: ', parameters);

    const simulation = new Simulation(parameters);
    let running = true;    

    while (running) {
        simulation.tick();
        simulation.update();
        await pause(200);
    }

}

runSimulation();
