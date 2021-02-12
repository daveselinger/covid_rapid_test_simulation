
class SimulationParameters {

    /** Starting Population size (Int) */
    populationSize = 10000;

    /** Starting infected rate (Float, 0-1) */
    startingInfectionRate = 0.004;

    /** Testing interval: Start out with every 3 days (Float: 0-100.0) */
    testingInterval = 3.0;

    /** Testing rate */
    testingRate = 0.6;

    /** Testing rate */
    testingRateRandom = 0.0;

    /** False positive % (Float, 0-1) */
    falsePositiveRate = 0.01;

    /** False negative % (Float, 01) */
    falseNegative = 0.02;

    /** % of symptomatic that will self isolate if symptomatic. */
    selfIsolationRate = 0.0;

    /** % of positives that will quarantine effectively (after positive test). */
    positiveQuarantineRate = 0.9;

    /** isolation after positive test or self isolation */
    positiveTestIsolationInterval = 21;

    /** Days to contagious (int) */
    daysToContagious = 2.5;
    daysToContagiousSTD = 0.5;

    /** Days to detectable (Float) */
    daysToDetectable = 2.5;
    daysToDetectableSTD = 0.5;

    /** Days to symptos (Float) */
    daysToSymptoms = 5.5;
    daysToSymptomsSTD = 2;

    /** Days to Recovery */
    daysToRecovery = 10;
    daysToRecoverySTD = 4;

    /** Mortality rate (Float, 0-1) */
    mortalityRate = 0.01;

    /** The rate of people who are infected but do not show symptoms. */
    asymptomaticRate = 0.2;

    /** Recovered Resistance (%, as a probability?) */
    recoveredResistance = 0.98;

    /** Mean/STD of # of interactions per day */
    numInteractions = 2.5;

    /**  */
    numInteractionsSTD = 1.0;

    /** Mean/STD of transmission per interaction */
    transmissionRate = 0.05;

    /**  */
    transmissionRateSTD = 0.1;

    /** Testing rate PCR */
    testingRatePcr = 0.000;

    /** RandomTesting rate PCR */
    testingRateRandomPcr = 0.003;

    /** Testing interval for PCR: Start out with every 3 days (Float: 0-100.0) */
    testingIntervalPcr = 3.0;

    /** False positive % for PCR (Float, 0-1) */
    falsePositiveRatePcr = 0.01;

    /** False negative % for PCR (Float, 01) */
    falseNegativePcr = 0.02;

    constructor(props = {}) {
        Object.assign(this, props);
    }

    /** days_to_pcr detectable. Sampled for this actor. */
    daysToPcrDetectable = 2;
    daysToPcrDetectableSTD = 0.5;

    /** The duration of virus shedding when antigen detection is positive. Sampled for this actor. */
    durationDaysOfPcrDetection = 24;
    durationDaysOfPcrDetectionSTD = 7;

    /** The delay from PCR test to results. Isolation is delayed by this ammount */
    daysToPcrResults = 1.5;

    /** days until the rapid test will detect. Sampled for this actor.  */
    daysToAntigenDetectable = 3;
    daysToAntigenDetectableSTD = 1;

    /** The duration of virus shedding when antigen detection is positive. Sampled for this actor. */
    durationDaysOfAntigenDetection = 10;
    durationDaysOfAntigenDetectionSTD = 3;

    /** Daily Vacination rate */
    vaccinationRate = 0.0035;

    /** Vaccination delay */
    vaccinationDelay = 28;

    /** Vaccination effectiveness */
    vaccinationEfficacy = 0.95;

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

/**
 * Use a box muller distribution to approximate a gaussian
 * @param {*} mean 
 * @param {*} std 
 */


const PRECISION = 1e9;
const _2PI = Math.PI * 2;
function gaussianRandom(mean,std=1){
  var u1 = Math.random();
  var u2 = Math.random();
  
  var z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(_2PI * u2);
  var z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(_2PI * u2);
  var r =  z0 * std + mean;
  if (r<0 || r > mean * 2) 
//  if (r<0) 
    return gaussianRandom(mean,std)
  else
    return r;
}

class Infection {
    /** The actor who is infected */
    myActor = null;

    /** The day the infection started. Date of exposure. 
     * TODO: Start doing this off a timestamp instead of a tick
    */
    startDay = null;

    /** Number of days infected */
    infectedTime = 0;

    /** The days until contagious. Sampled for this actor. */
    daysToContagious = -1;

    /** Whether this infection will be asymptomatic. Sampled for this actor. */
    asymptomatic = false;

    /** If symptomatic, the days until symptomatic. Sampled for this actor. */
    daysToSymptomatic = -1;

    /** days_to_pcr detectable. Sampled for this actor. */
    daysToPcrDetectable = -1;

    /** days until the rapid test will detect. Sampled for this actor.  */
    daysToAntigenDetectable = -1;

    /** The last day of contagious. Sampled for this actor. */
    daysToNotContagious = -1;

    /** The last day of symptoms. Sampled for this actor. */
    daysToNotSymptomatic = -1;
        
    /** The last day of detectable virus shedding using PCR test. Sampled for this actor. */
    daysToPcrNotDetectable = -1;

    /** The last day of detectable virus shedding using antigen test. Sampled for this actor. */
    daysToAntigenNotDetectable = -1;

    constructor(actor) {
        this.myActor = actor;
        this.infectedTime = 0;
        this.asymptomatic = ( Math.random() < this.myActor.simulationParameters.asymptomaticRate);

        //TODO: Sample these values in the future!
        let params=this.myActor.simulationParameters
        this.daysToContagious = gaussianRandom(params.daysToContagious, params.daysToContagiousSTD);
        this.daysToNotContagious = this.daysToContagious + gaussianRandom(params.daysToRecovery-params.daysToContagious,params.daysToRecoverySTD);
        this.daysToSymptomatic = gaussianRandom(params.daysToSymptoms,params.daysToSymptomaticSTD);
        this.daysToNotSymptomatic = this.daysToSymptomatic + gaussianRandom(params.daysToRecovery,params.daysToRecoverySTD);
        this.daysToPcrDetectable = gaussianRandom(params.daysToPcrDetectable,params.daysToPcrDetectableSTD);
        this.daysToPcrNotDetectable = this.daysToPcrDetectable + gaussianRandom(params.durationDaysOfPcrDetection,params.durationDaysOfPcrDetectionSTD);
        /* this assures that the sampled daysToAntigenDetectible is after the sampled daysToPcrDetectible */
        this.daysToAntigenDetectable = this.daysToPcrDetectable + gaussianRandom(params.daysToAntigenDetectable-params.daysToPcrDetectable,params.daysToAntigenDetectableSTD);
        this.daysToAntigenNotDetectable =this.daysToAntigenDetectable +  gaussianRandom(params.durationDaysOfAntigenDetection,params.durationDaysOfAntigenDetectionSTD);
        
    }

    tick(days=1.0) {
        this.infectedTime += days;
    }

    duration() {
        return this.infectedTime;
    }

    detectPcrTest() {
        return (this.duration() >  this.daysToPcrDetectable && 
            this.duration() < this.daysToPcrNotDetectable );
    }

    detectRapidTest() {
        return this.duration() > this.daysToAntigenDetectable &&
         this.duration() < this.daysToAntigenNotDetectable;
    }

    isSymptomatic() {
        if (this.asymptomatic) {
            return false;
        }
        return this.duration() > this.daysToSymptomatic &&
         this.duration() < this.daysToNotSymptomatic;
    }

    isContagious() {
        return this.duration() > this.daysToContagious &&
         this.duration() < this.daysToNotContagious;
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

    /** Number of days to delay before beginning isolation */
    isolateAfterRemain = 0;

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

    /** Days since most recent PCR test */
    testTimePcr = null;

    /** Days isolated  */
    daysIsolated = 0;

    /** Whether or not this actor is showing symptoms once infected. */
    isAsymptomatic = false;

    /** Whether or not this actor is showing symptoms or not. */
    isSymptomatic = false;

    /** Number of days remaining from vaccination to protection. */
    vaccinationRemain = 0;

    /** actor has been  vaccinated. */
    isVaccinated = false; 

    /** actor has vaccine protection. */
    isVaccinatedProtected=false;  

    /** Whether or not this actor will self-isolate when symptoms appear. */
    willSelfIsolate = true;

    /** Nmber of tests conducted. */
    testsConducted = 0;

    /** Nmber of Pcr tests conducted. */
    testsConductedPcr = 0;

    /** Whether or not this actor will comply with orders. */
    isNonCompliant = false;

    /** Is actor part of the rapid test testing program */
    isTesting = false;

    /** Is actor part of the Pcr routine testing program */
    isTestingPcr = false;

    myInfection = null;

    constructor(simulation) {
        this.simulation = simulation;
        this.simulationParameters = simulation.simulationParameters;

        // Initialize the day of the next test using uniform random.
//        this.testTimePcr = Math.floor(Math.random() * this.simulationParameters.testingIntervalPcr);
//        this.testTime = Math.floor(Math.random() * this.simulationParameters.testingInterval);
    }

    /**
     * Infect the individual. Starts as EXPOSED.
     */
    infect() {
        this.infectedTime = 0;
        this.status = ACTOR_STATUS.EXPOSED;
        this.isAsymptomatic = Math.random() < this.simulationParameters.asymptomaticRate;
        this.willSelfIsolate = Math.random() < this.simulationParameters.selfIsolationRate;

        this.myInfection = new Infection(this);
    }

    vaccinate(){
        this.isVaccinated=true;
        this.vaccinationRemain = gaussianRandom(this.simulationParameters.vaccinationDelay);
    }

    
    /**
     * Perform rapid test on actor
     */
    rapidTest() {
        this.testsConducted++;
        this.testTime = 0;

        if (this.status == ACTOR_STATUS.EXPOSED
            || this.status == ACTOR_STATUS.INFECTIOUS
        ) {
            if (this.myInfection.detectRapidTest()
                && Math.random() > this.simulationParameters.falseNegative
            ){
                //console.log('Tested positive', this.id);
                return true;
            }
        }
        if(Math.random() < this.simulationParameters.falsePositive) {
            //console.log('False positive ', this.id);
            return true;
        }
        return false;
    }
    /**
     * Perform PCR test on actor
     */
    pcrTest() {
        this.testsConductedPcr++;
        this.testTimePcr = 0;

        if (this.status == ACTOR_STATUS.EXPOSED
            || this.status == ACTOR_STATUS.INFECTIOUS
        ) {
            if (this.myInfection.detectPcrTest()
                && Math.random() > this.simulationParameters.falseNegativePcr
            ){
                console.log('Tested PCR positive', this.id);
                return true;
            }
        }
        if(Math.random() < this.simulationParameters.falsePositivePcr) {
            //console.log('False positive ', this.id);
            return true;
        }
        return false;
    }

    /**
     * Isolate actor for a number of days.
     * @param {number} days - The number of days to isolate (int).
     */
    isolateFor(days,after=0) {
        if(after ==0) {
            this.isolated = true;
        } else {
            this.isolateAfterRemain = after;
        }
        this.isolatedRemain = days;

    }
    
    /**
     * Perform updates to actor for each cycle.
     */
    tick(days=1.0){
        // First progress the status based on lifecycle
        if(this.myInfection !== null && this.status !== ACTOR_STATUS.RECOVERED) {
            if (this.status === ACTOR_STATUS.EXPOSED) {
                if (this.myInfection.isContagious()) {
                    this.status = ACTOR_STATUS.INFECTIOUS;
                }
            } else if (this.status === ACTOR_STATUS.INFECTIOUS) {
                if (!this.myInfection.isContagious()) {
                    if (Math.random() < this.simulationParameters.mortalityRate) {
                        this.status = ACTOR_STATUS.DECEASED;
                    } else {
                        this.status = ACTOR_STATUS.RECOVERED;
                    }
                } 
            }
            this.isSymptomatic = this.myInfection.isSymptomatic();
        }


        if (this.isolateAfterRemain > 0) {
            this.isolateAfterRemain-= days;
            if(this.isolateAfterRemain<=0) {
                this.isolated=true;
            }
        }

        // Advance the clock
        this.infectedTime += days;

        if (this.myInfection != null) {
            this.myInfection.tick(days);
        }

        if (this.isolated) {
            this.daysIsolated += days;
            this.isolatedRemain -= days;
            if (this.isolatedRemain <= 0) {
                this.isolated=false;
            }
        } 
        if (this.testTime !== null){
            this.testTime += days;
        }
        if (this.testTimePcr !== null){
            this.testTimePcr += days;
        }
        if (this.vaccinationRemain>0 ){
            this.vaccinationRemain-=days;

            // This can only happen once.
            if(this.vaccinationRemain<=0) {
                if(Math.random()<this.simulationParameters.vaccinationEfficacy) {
                    this.isVaccinatedProtected=true;
                }
            }
        }
    Math.random()<this.simulationParameters.vaccinationEfficacy
    }
}

class Simulation {
    simulationParameters = null;

    actors = [];

    totals = {
        susceptible:    0,
        infected:       0,
        recovered:      0,
        deceased:       0,
        testsConducted: 0,
        daysLost:       0
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
            a.isTestingPcr = Math.random() < this.simulationParameters.testingRatePcr;
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
        if (susceptible.isVaccinatedProtected ) {
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
            actor.tick(days);
            // Update totals
            switch (actor.status) {
                case ACTOR_STATUS.RECOVERED: { newTotals.recovered++; break; }
                case ACTOR_STATUS.SUSCEPTIBLE: { newTotals.susceptible++; break; }
                case ACTOR_STATUS.INFECTIOUS: { newTotals.infected++; break; }
                case ACTOR_STATUS.EXPOSED: { newTotals.infected++; break; }
                case ACTOR_STATUS.DECEASED: { newTotals.deceased++; break; }
            }
            newTotals.testsConducted+=actor.testsConducted;
            newTotals.daysLost+=actor.daysIsolated;
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
            //console.log(actor.id, 'infects', other.id);
            other.infect();
            return true;
        }
        if(this.hasBeenExposed(actor, other)) {
            //console.log(other.id, 'infects', actor.id);
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
                if (Math.random() < days) {
                    var interactions=gaussianRandom(this.simulationParameters.numInteractions,this.simulationParameters.numInteractionsSTD)
                    for (let encounter = 0; encounter < interactions; encounter++){
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
        this.tickPcrTesting(days);
        this.tickVaccination(days);
        this.tickDisease(days);
    }

    /**
     * Implement daily rapid testing policy
     */
    tickRapidTesting(days = 1.0) { 
        // Perform rapid testing
        for (const actor of this.actors) {
            if(((actor.isTesting && (actor.testTime === null
                || actor.testTime >= this.simulationParameters.testingInterval))
                || (Math.random()<this.simulationParameters.testingRateRandom/days))
                && !actor.isolated
                && actor.rapidTest()
            ) {
                // TODO: Can sample these as well.
                if(Math.random()<this.simulationParameters.positiveQuarantineRate) {
                    actor.isolateFor(this.simulationParameters.positiveTestIsolationInterval);
                    //console.log('Isolated ', actor.id);                    
                } else {
                    //console.log('Isolation non compliance', actor.id);
                }
            }
            //TODO: Some actors become sick and never become "unsick" so they isolate forever.
            if (actor.isSymptomatic && actor.willSelfIsolate && !actor.isolated) {
                actor.isolateFor(this.simulationParameters.positiveTestIsolationInterval);
            }
        }
    }
    /**
     * Implement pcr testing policy
     */
    tickPcrTesting(days = 1.0) { 
        // Perform pcr testing
        for (const actor of this.actors) {
            if( 
                ((Math.random()<this.simulationParameters.testingRateRandomPcr/days) ||
                    (actor.isTestingPcr && (actor.testTimePcr === null || 
                        actor.testTimePcr >= this.simulationParameters.testingIntervalPcr)))
                && !actor.isolated
                && actor.pcrTest()
            ) {
                // TODO: Can sample these as well.
                if(Math.random()<this.simulationParameters.positiveQuarantineRate) {
                    console.log('Isolated PCR', actor.id); 
                    actor.isolateFor(this.simulationParameters.positiveTestIsolationInterval,
                        this.simulationParameters.daysToPcrResults);
                } else {
                    //console.log('Isolation non compliance', actor.id);
                }
            }
            //TODO: Some actors become sick and never become "unsick" so they isolate forever.
            if (actor.isSymptomatic && actor.willSelfIsolate && !actor.isolated) {
                actor.isolateFor(this.simulationParameters.positiveTestIsolationInterval);
            }
        }
    }
    tickVaccination(days = 1.0) { 
        // Perform random vaccination
        // TODO: find a better way to do
        for (const actor of this.actors) {
            if(!actor.isVaccinated && 
                Math.random()<this.simulationParameters.vaccinationRate*days){
                actor.vaccinate();
            }
        }
    }
}
