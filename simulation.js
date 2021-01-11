
class SimulationParameters {

    /** Starting Population size (Int) */
    populationSize = 1000;

    /** Starting infected rate (Float, 0-1) */
    startingInfectionRage = 0.004;

    /** Testing interval: Start out with every 3 days (Float: 0-100.0) */
    testingInterval = 3.0;

    /** Testing rate */
    testingRate = 0.6;

    /** False positive % (Float, 0-1) */
    falsePositiveRate = 0.01;

    /** False negative % (Float, 01) */
    falseNegative = 0.02;

    /** % of positives that will quarantine effectively (after positive test). */
    positiveQuarantineRate = 0.5;

    /** Days to contagious (int) */
    daysToContagious = 2.5;

    /** Days to detectable (Float) */
    daysToDetectable = 3.5;

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

/** 
 * activity is a risk modifier. 1.0 is normal, 0.0 is safe, >1.0 is risky
*/
const ACTIVITY = {
    NORMAL: 1.0,
    SAFE: 0.1,
};

/**
 *   protection is 1.0 for no protection, 0 for full protection
 * */
const ACTOR_PROTECTION = {
    NONE: 1.0,
    MASK: 0.1,
};


class Actor {  

    /** Blue-healthy/Susceptible */
    status = ACTOR_STATUS.SUSCEPTIBLE;

    /** Isolated/Not isolated (impacted by rapid testing) */
    isolated = false;
    isolatedRemain=0; /* number of days of isolation remaining */

    /** The number of days this actor was infected. */
    infectedTime = null;

    /** The horizontal position of this actor. */
    xPosition = 0;

    /** The vertical position of this actor. */
    yPosition = 0;

    /** ID number */
    id=0;

    /** By default actor has no protection */
    protection=ACTOR_PROTECTION.NONE

    /** Days since rapid test */
    testTime = null

    /** infect the individual. Starts as EXPOSED */
    infect() {
        this.infectedTime=0;
        this.status=ACTOR_STATUS.EXPOSED
    }

    /** isolate actor for a number of days */
    isolateFor(days){
        this.isolated=true
        this.isolatedRemain=days
    }
    
    /** perform updates to actor for ticks */
    tick(config){
        if (this.status === ACTOR_STATUS.EXPOSED) {
            if (this.infectedTime+Math.random()>config.daysToContagious) {
                this.status=ACTOR_STATUS.INFECTIOUS;
            }
            this.infectedTime+=1.0;
        } else if (this.status==ACTOR_STATUS.INFECTIOUS) {
            if (this.infectedTime+Math.random()>config.daysToRecovery) {
                if (Math.random()<config.mortalityRate) {
                    this.status=ACTOR_STATUS.DECEASED;
                } else {
                    this.status=ACTOR_STATUS.RECOVERED;
                }
            }   
            this.infectedTime+=1.0;           
        }
        if (this.isolated) {
            this.isolatedRemain-=1.0
            if (this.isolatedRemain<=0) {
                this.isolated=false
            }
        }
        if (this.testTime !== null ){
            this.testTime+=1.0
        }
    }
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
            a.isTesting = Math.random()<this.config.testingRate;
            this.actors.push(a)
        }
        /* initial exposed subpopulation */
        for (var cnt=0;cnt<Math.max(1,this.config.startingInfectionRage*this.config.populationSize);cnt++){
            var idx=Math.floor(Math.random()*this.actors.length)
            console.log("inital infection ",idx)
            this.actors[idx].infect();
        }
    }
    countof(status) {
        return this.actors.filter(actor => {
            return actor.status === status
          }).length     
    }
    /***
     * Models transmission from an infected individual to a suseptible
     * individual.
     * duration is in days (default is 15 minutes 0.0104)
     * 
     * TODO: model full viral load dynamics and exposure duration
     */
    hasBeenExposed(suseptible,infected,duration=0.0104,activity=ACTIVITY.NORMAL) {
        if (infected.status != ACTOR_STATUS.INFECTIOUS
            || suseptible.status != ACTOR_STATUS.SUSCEPTIBLE) {
            return false
        }
        if (infected.isolated)
            return false
        if (Math.random()<this.config.transmissionRate
            *infected.protection
            *activity
            *duration/0.0104) {
            return true
        }
        return false
    }
    /**
     * Perform rapid test on actor
     */
    rapidTest(actor) {
        if (actor.status == ACTOR_STATUS.EXPOSED ||
            actor.status == ACTOR_STATUS.INFECTIOUS) {
            if ( actor.infectedTime>this.config.daysToDetectable
                && actor.infectedTime<this.config.daysToRecovery
                && Math.random()>this.config.falseNegative){
                    console.log("tested positive",actor.id)
                    actor.testTime=0
                    return true
            }
        }
        if( Math.random()<this.config.falsePositive) {
            console.log("False positive ",actor.id)
            actor.testTime=0
            return true
        }
        return false
    }
    /**
     * Handles the model tick except for exposure 
     */
    tickDisease() {
        this.tickCnt++;
        // This handles disease progression
        // TODO: cost model
        for (var actor of this.actors) {
            actor.tick(this.config)
        } 
    }
    /***
     * This is the outer tick. To be overriden by subclasses.
     * Should implement policies such as social distancing,
     * isolation or testing.
     * This base model just picks random actors to infect
     */
    tick() {
        for (var actor of this.actors) {
            if (actor.status === ACTOR_STATUS.INFECTIOUS &&
                ! actor.isolated) { 
                    // Pick a random nearby actor to expose
                    for (var encounter=0;encounter<this.config.numInteractions;encounter++){
                        var othera=this.actors[Math.floor(Math.random()*this.actors.length)]
                        if(this.hasBeenExposed(othera,actor)) {
                            console.log(actor.id,"infects",othera.id)
                            othera.infect();   
                        }
                    }
            } 
        } 
        /* perform rapid testing */
        for (var actor of this.actors) {
            if(actor.isTesting 
                && (actor.testTime===null ||
                    actor.testTime>this.config.testingInterval)
                && !this.isolated
                && this.rapidTest(actor)) {
                actor.isolateFor(14)
                console.log("Isolated ",actor.id)
            }
        }
        this.tickDisease()
    }

}
