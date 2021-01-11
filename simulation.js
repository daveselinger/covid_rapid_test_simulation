
class SimulationParameters {

    /** Starting Population size (Int) */
    populationSize = 49;

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

    /** Days to Recovery */
    daysToRecovery = 14;

    /** Mortality rate (Float, 0-1) */
    mortalityRate = 0.01;

    /** Recovered Resistance (%, as a probability?) */
    recoveredResistance = 0.98;

    /** Mean/STD of # of interactions per day */
    numInteractions =3.0;
    numInteractionsSTD = 0.02;

    /** Mean/STD of transmission per interaction */
    transmissionRate = 0.05;
    transmissionRateSTD = 0.1;
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

    /** ID number */
    id=0;
}

class Simulation {

    config;

    actors = [];

    tickCnt=0;

    constructor(simulationParameters) {
        this.config = simulationParameters;
        var rows=Math.floor(Math.sqrt(this.config.populationSize));
        for (let i = 0; i < this.config.populationSize; i++) {
            var a=new Actor()
            a.xPosition=i%rows
            a.yPosition=Math.floor(i/rows)
            a.id=i;
            this.actors.push(a)
        }
        /* initial exposed subpopulation */
        for (var cnt=0;cnt<Math.max(1,this.config.startingInfectionRage*this.config.populationSize);cnt++){
            var idx=Math.floor(Math.random()*this.actors.length)
            this.actors[idx].status=ACTOR_STATUS.EXPOSED;
        }
    }
    countof(status) {
        return this.actors.filter(actor => {
            return actor.status === status
          }).length     
    }
    /**
     * Handles the model tick except for exposure 
     */
    tickDisease() {
        this.tickCnt++;
        // This handles disease progression
        // TODO: cost model
        for (var actor of this.actors) {
            if (actor.status === ACTOR_STATUS.EXPOSED) {
                if (actor.infectedTime+Math.random()>this.config.daysToContagious) {
                    actor.status=ACTOR_STATUS.INFECTIOUS;
                }
                actor.infectedTime++;
            } else if (actor.status==ACTOR_STATUS.INFECTIOUS) {
                if (actor.infectedTime+Math.random()>this.config.daysToRecovery) {
                    if (Math.random()<this.config.mortalityRate) {
                        actor.status=ACTOR_STATUS.DECEASED;
                    } else {
                        actor.status=ACTOR_STATUS.RECOVERED;
                    }
                }   
                actor.infectedTime++;           
            }
        } 
    }
    /***
     * This is the outer tick. To be overriden by subclasses.
     * This base model just picks random actors to infect
     */
    tick() {
        for (var actor of this.actors) {
            if (actor.status === ACTOR_STATUS.INFECTIOUS &&
                ! actor.isolated) { 
                    // Pick a random nearby actor to expose
                    for (var encounter=0;encounter<this.config.numInteractions;encounter++){
                        if(Math.random()<this.config.transmissionRate) {
                            var othera=this.actors[Math.floor(Math.random()*this.actors.length)] 
                            if(othera.status==ACTOR_STATUS.SUSCEPTIBLE) {
                                othera.status=ACTOR_STATUS.EXPOSED;
                                console.log(actor.id, " infects ",othera.id)
                            }
                        }

                    }
            } 
        } 
        this.tickDisease()
    }

}
