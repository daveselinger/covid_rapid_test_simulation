
class SimulationParameters {

    /** Starting Population size (Int) */
    populationSize = 50;

    /** Starting infected rate (Float, 0-1) */
    startingInfectionRage = 0.004;

    /** Frequency of testing: Start out with every 3 days (Float: 0-100.0) */
    testingInterval = 0.333;

    /** False positive % (Float, 0-1) */
    falsePositiveRate = 0.01;

    /** False negative % (Float, 01) */
    falseNegative = 0.02;

    /** % of positives that will quarantine effectively (after positive test). */
    positiveQuarantineRate = 0.5;

    /** Days to contagious (int) */
    daysToContagious = 1.5;

    /** Days to detectable (Float) */
    daysToDetectable = 1.5;

    /** Recovered Resistance (%, as a probability?) */
    recoveredResistance = 0.98;

    /** Mean/STD of # of interactions */


    /** Mean/STD of transmission per interaction */

}

const ACTOR_STATUS = {
    SUSCEPTIBLE: 0,
    EXPOSED: 1,
    INFECTIOUS: 2,
    RECOVERED: 3,
    DECEASED: 4
};

class Actor {  

    /** Blue-healthy/Susceptible */
    status = ACTOR_STATUS.SUSCEPTIBLE;

    /** Isolated/Not isolated (impacted by rapid testing) */
    isolated = false;

    /** The number of days this actor was infected. */
    infectedTime = null;

    /** The horizontal position of this actor. */
    xPosition = 0;

    /** The vertical position of this actor. */
    yPosition = 0;

}

class Simulation {

    config;

    actors = [];

    constructor(simulationParameters) {
        this.config = simulationParameters;

        for (let i = 9; i < this.config.populationSize; i++) {
            this.actors.push(
                new Actor()
            );
        }
    }

    /**
     * 
     */
    tick() {
        
    }

}
