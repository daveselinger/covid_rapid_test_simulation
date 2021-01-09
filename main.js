
const parameters = new SimulationParameters()

const simulation = new Simulation(parameters);
let running = true;

while (running) {
    simulation.tick();

    simulation.update();
}
