
class SimulationParameters {

    /** Starting Population size (Int) */
    populationSize = 10000;

    /** Starting infected rate (Float, 0-1) */
    startingInfectionRate = 0.004;

    /** Testing interval: Start out with every 3 days (Float: 0-100.0) */
    testingInterval = 3.0;

    /** Testing rate */
    testingRate = 0.6;

    /** False positive % (Float, 0-1) */
    falsePositiveRate = 0.01;

    /** False negative % (Float, 01) */
    falseNegative = 0.02;

    /** % of symptomatic that will self isolate if symptomatic. */
    selfIsolationRate = 0.1;

    /** % of positives that will quarantine effectively (after positive test). */
    positiveQuarantineRate = 0.9;

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

    /** The rate of people who are infected but do not show symptoms. */
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

    constructor(props = {}) {
        Object.assign(this, props);
    }

    /** days_to_pcr detectable. Sampled for this actor. */
    daysToPcrDetectable = 2;

    /** days until the rapid test will detect. Sampled for this actor.  */
    daysToAntigenDetectable = 3;

    /** The duration of virus shedding when antigen detection is positive. Sampled for this actor. */
    durationDaysOfAntigenDetection = 10;
}

const ACTOR_STATUS = {
    SUSCEPTIBLE: 0,
    EXPOSED:     1,
    INFECTIOUS:  2,
    RECOVERED:   3,
    DECEASED:    4
};

/** 
 * Activity is a risk modifier. 1.0 is normal, 0.0 is safe, >1.0 is risky
 */
const ACTIVITY = {
    NORMAL: 1.0,
    SAFE:   0.1,
};

/**
 * Protection is 1.0 for no protection, 0 for full protection
 */
const ACTOR_PROTECTION = {
    NONE: 1.0,
    MASK: 0.1,
};


class Infection {
    /** The actor who is infected */
    myActor = null;

    /** The day the infection started. Date of exposure. 
     * TODO: Start doing this off a timestamp instead of a tick
    */
    startDay = null;

    /** Number of days infected */
    infectedTime = 0;

    /** Whether this infection will be symptomatic. Sampled for this actor. */
    symptomatic = false;

    /** If symptomatic, the days until symptomatic. Sampled for this actor. */
    daysToSymptomatic = -1;

    /** days_to_pcr detectable. Sampled for this actor. */
    daysToPcrDetectable = -1;

    /** days until the rapid test will detect. Sampled for this actor.  */
    daysToAntigenDetectable = -1;

    /** The duration of virus shedding when antigen detection is positive. Sampled for this actor. */
    durationDaysOfAntigenDetection = -1;

    constructor(actor) {
        this.myActor = actor;
        this.infectedTime = 0;
        this.symptomatic = !( Math.random() < this.myActor.simulationParameters.asymptomaticRate);

        //TODO: Sample these values in the future!
        this.daysToSymptomatic = this.myActor.simulationParameters.daysToSymptoms;
        this.daysToPcrDetectable = this.myActor.simulationParameters.daysToPcrDetectable;
        this.daysToAntigenDetectable = this.myActor.simulationParameters.daysToAntigenDetectable;
        this.durationDaysOfAntigenDetection = this.myActor.simulationParameters.durationDaysOfAntigenDetection;
    }

    infectedTime() {
        return this.infectedTime;
    }

    performPCRTest() {
        return this.infectedTime() > this.daysToPcrDetectable && this.infectedTime() < 30;
    }
}

class Actor {  
    simulation = null;
    
    /** The parameters of the overall simulation for this actor */
    simulationParameters = null;

    /** Blue-healthy/Susceptible. */
    status = ACTOR_STATUS.SUSCEPTIBLE;

    /** Isolated/Not isolated (impacted by rapid testing). */
    isolated = false;

    /** Number of days of isolation remaining. */
    isolatedRemain = 0;

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

    /** Days since most recent rapid test */
    testTime = null;

    /** Days isolated  */
    daysIsolated = 0;

    /** Whether or not this actor is showing symptoms once infected. */
    isAsymptomatic = false;

    /** Whether or not this actor is showing symptoms or not. */
    isSymptomatic = false;

    /** Whether or not this actor will self-isolate when symptoms appear. */
    willSelfIsolate = true;

    /** Nmber of tests conducted. */
    testsConducted = 0;

    /** Whether or not this actor will comply with orders. */
    isNonCompliant = false;

    myInfection = null;

    constructor(simulation) {
        this.simulation = simulation;
        this.simulationParameters = simulation.simulationParameters;
    }

    /**
     * infect the individual. Starts as EXPOSED.
     */
    infect() {
        this.infectedTime = 0;
        this.status = ACTOR_STATUS.EXPOSED;
        this.isAsymptomatic = Math.random() < this.simulationParameters.asymptomaticRate;
        this.willSelfIsolate = Math.random() < this.simulationParameters.selfIsolationRate;

        this.myInfection = new Infection(this);
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
    tick(){
        // First progress the status based on lifecycle
        if (this.status === ACTOR_STATUS.EXPOSED) {
            if (this.infectedTime+Math.random() > this.simulationParameters.daysToContagious) {
                this.status = ACTOR_STATUS.INFECTIOUS;
            }
        } else if (this.status === ACTOR_STATUS.INFECTIOUS) {
            if (this.infectedTime + Math.random() > this.simulationParameters.daysToRecovery) {
                if (Math.random() < this.simulationParameters.mortalityRate) {
                    this.status = ACTOR_STATUS.DECEASED;
                } else {
                    this.status = ACTOR_STATUS.RECOVERED;
                }
            } 
            if(this.infectedTime > this.simulationParameters.daysToSymptoms && !this.isAsymptomatic) {
                this.isSymptomatic = true;
            }
        }

        // Advance the clock
        this.infectedTime += 1.0;

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

    simulationParameters = null;

    actors = [];

    totals = {
        susceptible: 0,
        infected:    0,
        recovered:   0,
        deceased:    0,
        testsConducted: 0,
        daysLost:   0,
    }

    daysElapsed = 0;

    constructor(simulationParameters) {
        this.simulationParameters = simulationParameters;
        let rows = Math.floor(Math.sqrt(this.simulationParameters.populationSize));
        for (let i = 0; i < this.simulationParameters.populationSize; i++) {
            let a = new Actor(this);
            a.xPosition = i % rows;
            a.yPosition = Math.floor(i/rows);
            a.id = i;
            a.isTesting = Math.random() < this.simulationParameters.testingRate;
            a.isNonCompliant = Math.random()<this.simulationParameters.nonCompliantRate;
            this.actors.push(a)
        }
        // Initial exposed subpopulation
        for (let cnt = 0; cnt < Math.max(1, this.simulationParameters.startingInfectionRate * this.simulationParameters.populationSize); cnt++){
            const idx = Math.floor(Math.random() * this.actors.length);
            this.actors[idx].infect();
            this.totals.infected++;
        }

        // The remaining susceptible, after we've created the initially infected
        this.totals.susceptible = this.simulationParameters.populationSize - this.totals.infected;
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
        if (Math.random() < this.simulationParameters.transmissionRate
            * infected.protection
            * activity
            * duration / 0.0104
        ) {
            susceptible.infect();
            return true;
        }
        return false;
    }

    /**
     * Perform rapid test on actor
     */
    rapidTest(actor) {
        actor.testsConducted++;
        if (actor.status == ACTOR_STATUS.EXPOSED
            || actor.status == ACTOR_STATUS.INFECTIOUS
        ) {
            if (actor.infectedTime > this.simulationParameters.daysToDetectable
                && actor.infectedTime < this.simulationParameters.daysToRecovery
                && Math.random() > this.simulationParameters.falseNegative
            ){
                console.log('Tested positive', actor.id);
                actor.testTime = 0;
                return true;
            }
        }
        if(Math.random() < this.simulationParameters.falsePositive) {
            console.log('False positive ', actor.id);
            actor.testTime = 0;
            return true;
        }
        return false;
    }

    /**
     * Perform PCR test on actor
     */
    PCRTest(actor) {
        actor.testsConducted++;
        if (actor.status == ACTOR_STATUS.EXPOSED
            || actor.status == ACTOR_STATUS.INFECTIOUS
        ) {
            if (actor.infectedTime > this.simulationParameters.daysToDetectable
                && actor.infectedTime < this.simulationParameters.daysToRecovery
                && Math.random() > this.simulationParameters.falseNegative
            ){
                console.log('Tested positive', actor.id);
                actor.testTime = 0;
                return true;
            }
        }
        if(Math.random() < this.simulationParameters.falsePositive) {
            console.log('False positive ', actor.id);
            actor.testTime = 0;
            return true;
        }
        return false;
    }

    /**
     * Handles the disease progression in all actors
     */
    tickDisease(days = 1) {
        this.daysElapsed+=days;
        const newTotals = {
            susceptible:    0,
            infected:       0,
            recovered:      0,
            deceased:       0,
            testsConducted: 0,
            daysLost:       0
        };

        // This handles disease progression
        // TODO: cost model
        for (const actor of this.actors) {
            actor.tick();
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

    /**
     * Check for exposure in either direction and infect the susceptible actor
     * if exposure occured. This can be called for collision detect based interactions.
     * @returns {Boolean} - Whether there was a resulting infection `TRUE` or not `FALSE`.
     */
    checkExposure(actor, other, duration = 0.0104, activity = ACTIVITY.NORMAL) {
        if(this.hasBeenExposed(other, actor)) {
            console.log(actor.id, 'infects', other.id);
            other.infect();
            return true;
        }
        if(this.hasBeenExposed(actor, other)) {
            console.log(other.id, 'infects', actor.id);
            actor.infect();
            return true;
        }
        return false;
    }

    /** 
     * Generate daily interactions based on simulation parameters. 
     * This is not used if interactions are based on collision detection.
     */
    tickInteractions(days = 1.0) {
        for (const actor of this.actors) {
            if (actor.status === ACTOR_STATUS.INFECTIOUS && !actor.isolated) { 
                // Determine if we infect based on # of interactions and % of day passed
                // TODO: Roger check this distribution. Mean = 1
                if (Math.random() < days) {
                    for (let encounter = 0; encounter < this.simulationParameters.numInteractions; encounter++){
                        // Pick a random nearby actor to expose
                        const other = this.actors[Math.floor(Math.random() * this.actors.length)];
                        this.checkExposure(other, actor);
                    }
                }
            }
        } 
    }

    /***
     * This is the outer tick. To be overriden by subclasses.
     * Should implement policies such as social distancing,
     * isolation or testing.
     * This base model just picks random actors to infect
     */
    tick(days = 1) {
        this.tickInteractions(days);
        this.tickRapidTesting(days);
        this.tickDisease(days);
    }

    /**
     * Implement daily rapid testing policy
     */
    tickRapidTesting() { 
        // Perform rapid testing
        for (const actor of this.actors) {
            if(actor.isTesting 
                && (actor.testTime === null || actor.testTime > this.simulationParameters.testingInterval)
                && !this.isolated
                && this.rapidTest(actor)
            ) {
                if(Math.random()<this.simulationParameters.positiveQuarantineRate) {
                    actor.isolateFor(this.simulationParameters.positiveTestIsolationInterval);
                    console.log('Isolated ', actor.id);                    
                } else {
                    console.log('Isolation non compliance', actor.id);
                }
            }
            if (actor.isSymptomatic && actor.willSelfIsolate && !actor.isolated) {
                actor.isolateFor(this.simulationParameters.positiveTestIsolationInterval);
            }
        }
    }

}
