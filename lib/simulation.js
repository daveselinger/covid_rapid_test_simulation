
class SimulationParameters {

    /** Starting Population size (Int) */
    populationSize = 1000;

    /** Starting infected rate (Float, 0-1) */
    startingInfectionRage = 0.004;

    /** Testing interval: Start out with every 3 days (Float: 0-100.0) */
    testingInterval = 3.0;

    /** Testing rate */
    testingRate = 0.1;

    /** False positive % (Float, 0-1) */
    falsePositiveRate = 0.01;

    /** False negative % (Float, 01) */
    falseNegative = 0.02;

    /** % of symptomatic that will self isolate if symptomatic. */
    selfIsolationRate = 0.1;

    /** % of positives that will quarantine effectively (after positive test). */
    positiveQuarantineRate = 0.5;

    /** isolation after positive test or self isolation */
    positiveTestIsolationInterval = 14;

    /** Days to contagious (int) */
    daysToContagious = 2.5;

    /** Days to detectable (Float) */
    daysToDetectable = 3.5;

    /** Days to symptos (Float) */
    daysToSymptoms = 5.5;

    /** Days to Recovery */
    daysToRecovery = 14;

    /** Mortality rate (Float, 0-1) */
    mortalityRate = 0.01;

    /** asymptomatic infections */
    asymptomaticRate = 0.2;

    /** Recovered Resistance (%, as a probability?) */
    recoveredResistance = 0.98;

    /** Mean/STD of # of interactions per day */
    numInteractions = 3.0;

    /** TODO: How do I differ from `numInteractions`? */
    numInteractionsSTD = 0.02;

    /** Mean/STD of transmission per interaction */
    transmissionRate = 0.05;

    /** TODO: How do I differ from `transmissionRate`? */
    transmissionRateSTD = 0.1;
}

const ACTOR_STATUS = {
    SUSCEPTIBLE: 0,
    EXPOSED: 1,
    INFECTIOUS: 2,
    RECOVERED: 3,
    DECEASED: 4
};

/** 
 * Activity is a risk modifier. 1.0 is normal, 0.0 is safe, >1.0 is risky
 */
const ACTIVITY = {
    NORMAL: 1.0,
    SAFE: 0.1,
};

/**
 * Protection is 1.0 for no protection, 0 for full protection
 */
const ACTOR_PROTECTION = {
    NONE: 1.0,
    MASK: 0.1,
};


class Actor {  

    /** Blue-healthy/Susceptible. */
    status = ACTOR_STATUS.SUSCEPTIBLE;

    /** Isolated/Not isolated (impacted by rapid testing). */
    isolated = false;

    /** Number of days of isolation remaining. */
    isolatedRemain=0;

    /** The number of days this actor was infected. */
    infectedTime = null;

    /** The horizontal position of this actor. */
    xPosition = 0;

    /** The vertical position of this actor. */
    yPosition = 0;

    /** ID of this actor. */
    id = 0;

    /** By default actor has no protection */
    protection = ACTOR_PROTECTION.NONE;

    /** Days since rapid test */
    testTime = null;

    /** Days isolated  */
    daysIsolated = 0;

    /** isAsymptomatic */
    isAsymptomatic = false;

    /** is showing symptoms */
    isSymptomatic = false;

    /** will isolate when symptoms appear */
    willSelfIsolate = true;

    /** number of test conducted */
    testsConducted = 0;

    /** isNonCompliant */
    isNonCompliant = false;


    /**
     * infect the individual. Starts as EXPOSED.
     */
    infect(config) {
        this.infectedTime = 0;
        this.status = ACTOR_STATUS.EXPOSED;
        this.isAsymptomatic=Math.random()<config.asymptomaticRate;
        this.willSelfIsolate=Math.random()<config.selfIsolationRate;
    }

    /**
     * Isolate actor for a number of days.
     * @param {number} days - The number of days to isolate (int).
     */
    isolateFor(days){
        this.isolated = true;
        this.isolatedRemain = days;
    }
    
    /**
     * Perform updates to actor for each cycle.
     */
    tick(config){
        if (this.status === ACTOR_STATUS.EXPOSED) {
            if (this.infectedTime+Math.random()>config.daysToContagious) {
                this.status = ACTOR_STATUS.INFECTIOUS;
            }
            this.infectedTime += 1.0;
        } else if (this.status === ACTOR_STATUS.INFECTIOUS) {
            if (this.infectedTime + Math.random() > config.daysToRecovery) {
                if (Math.random() < config.mortalityRate) {
                    this.status = ACTOR_STATUS.DECEASED;
                } else {
                    this.status = ACTOR_STATUS.RECOVERED;
                }
            } 
            if(this.infectedTime>config.daysToSymptoms &&
                !this.isAsymptomatic) {
                this.isSymptomatic = true;
            }
            this.infectedTime += 1.0;
        }

        if (this.isolated) {
            this.daysIsolated++;
            this.isolatedRemain -= 1.0;
            if (this.isolatedRemain <= 0) {
                this.isolated=false;
            }
        }
        if (this.testTime !== null){
            this.testTime += 1.0;
        }
    }

}

class Simulation {

    config;

    actors = [];

    totals = {
        susceptible: 0,
        infected:    0,
        recovered:   0,
        deceased:    0,
        testsConducted: 0,
        daysLost:   0,
    }

    tickCnt = 0;

    constructor(simulationParameters) {
        this.config = simulationParameters;
        let rows = Math.floor(Math.sqrt(this.config.populationSize));
        for (let i = 0; i < this.config.populationSize; i++) {
            let a = new Actor();
            a.xPosition = i % rows;
            a.yPosition = Math.floor(i/rows);
            a.id = i;
            a.isTesting = Math.random() < this.config.testingRate;
            a.isNonCompliant = Math.random()<this.config.nonCompliantRate;
            this.actors.push(a)
        }
        // Initial exposed subpopulation
        for (let cnt = 0; cnt < Math.max(1, this.config.startingInfectionRage * this.config.populationSize); cnt++){
            const idx = Math.floor(Math.random() * this.actors.length);
            console.log("inital infection ", idx);
            this.actors[idx].infect(this.config);
            this.totals.infected++;
        }

        // The remaining susceptible, after we've created the initially infected
        this.totals.susceptible = this.config.populationSize - this.totals.infected;
    }

    /***
     * Models transmission from an infected individual to a susceptible
     * individual.
     * duration is in days (default is 15 minutes 0.0104)
     * 
     * TODO: model full viral load dynamics and exposure duration
     */
    hasBeenExposed(susceptible, infected, duration=0.0104, activity = ACTIVITY.NORMAL) {
        if (infected.status !== ACTOR_STATUS.INFECTIOUS
            || susceptible.status !== ACTOR_STATUS.SUSCEPTIBLE
        ) {
            return false;
        }
        if (infected.isolated) {
            return false;
        }
        if (Math.random() < this.config.transmissionRate
            * infected.protection
            * activity
            * duration / 0.0104
        ) {
            susceptible.infect(this.config);
            return true;
        }
        return false;
    }

    /**
     * Perform rapid test on actor
     */
    rapidTest(actor) {
        actor.testsConducted++
        if (actor.status == ACTOR_STATUS.EXPOSED
            || actor.status == ACTOR_STATUS.INFECTIOUS
        ) {
            if (actor.infectedTime > this.config.daysToDetectable
                && actor.infectedTime < this.config.daysToRecovery
                && Math.random() > this.config.falseNegative
            ){
                console.log("Tested positive", actor.id);
                actor.testTime = 0;
                return true;
            }
        }
        if(Math.random() < this.config.falsePositive) {
            console.log("False positive ", actor.id);
            actor.testTime = 0;
            return true;
        }
        return false;
    }

    /**
     * Handles the model tick except for exposure 
     */
    tickDisease() {
        this.tickCnt++;
        const newTotals = {
            susceptible: 0,
            infected:    0,
            recovered:   0,
            deceased:    0,
            testsConducted: 0,
            daysLost:   0,
        };

        // This handles disease progression
        // TODO: cost model
        for (const actor of this.actors) {
            actor.tick(this.config);
            // Update totals
            switch (actor.status) {
                case ACTOR_STATUS.RECOVERED: { newTotals.recovered++; break; }
                case ACTOR_STATUS.SUSCEPTIBLE: { newTotals.susceptible++; break; }
                case ACTOR_STATUS.INFECTIOUS: { newTotals.infected++; break; }
                case ACTOR_STATUS.EXPOSED: { newTotals.infected++; break; }
                case ACTOR_STATUS.DECEASED: { newTotals.deceased++; break; }
            }
            newTotals.testsConducted+=actor.testsConducted
            newTotals.daysLost+=actor.daysIsolated
        }
        this.totals = newTotals;
    }

    /***
     * This is the outer tick. To be overriden by subclasses.
     * Should implement policies such as social distancing,
     * isolation or testing.
     * This base model just picks random actors to infect
     */
    tick() {
        for (const actor of this.actors) {
            if (actor.status === ACTOR_STATUS.INFECTIOUS && !actor.isolated) { 
                // Pick a random nearby actor to expose
                for (let encounter = 0; encounter < this.config.numInteractions; encounter++){
                    let others = this.actors[Math.floor(Math.random() * this.actors.length)];
                    if(this.hasBeenExposed(others, actor)) {
                        console.log(actor.id, "infects", others.id);
                        others.infect(this.config);
                    }
                }
            } 
        } 

        // Perform rapid testing
        for (const actor of this.actors) {
            if(actor.isTesting 
                && (actor.testTime === null || actor.testTime > this.config.testingInterval)
                && !this.isolated
                && this.rapidTest(actor)
            ) {
                if(Math.random()<this.config.positiveQuarantineRate) {
                    actor.isolateFor(this.config.positiveTestIsolationInterval);
                    console.log("Isolated ", actor.id);                    
                } else {
                    console.log("Isolation non compliance", actor.id);
                }
            }
            if (actor.isSymptomatic && actor.willSelfIsolate && !actor.isolated) {
                actor.isolateFor(this.config.positiveTestIsolationInterval);
            }

        }
        this.tickDisease();
    }

}
