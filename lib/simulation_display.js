class SimulationDisplay {
    simulation = null;
    line_chart = null;
    chart_config = null;
    steps = 0;

    simulation_step = -1;
    running = false;

<<<<<<< HEAD
    constructor (parameters, steps) {
        this.simulation = new Simulation(parameters);
=======
    constructor (line_chart_element, parameters, steps) {
        this.updateSimulation(parameters);
>>>>>>> allow simulation to be updated without changing chart.  Added non-animated using start(0)
        this.steps = steps;
    }

    getChart(other) {
        this.chart_config = other.chart_config;
        this.line_chart = other.line_chart;
    }
    
    initChart(line_chart_element) {
        //Initialize chart
        var ctx = line_chart_element.getContext("2d");

        this.chart_config = initChart(this.steps);
        this.line_chart = new Chart(ctx, this.chart_config);
        this.line_chart.options.animation = false; 
    }
    updateSimulation(parameters) {
        this.simulation = new Simulation(parameters);
    }

    tickSimulation (t,timeout=5) {
        if (t==this.steps || !this.running) {
            console.log("End");
            this.running = false;
            return;
        }

        this.simulation.tick();

        console.log(this.simulation.daysElapsed,
            this.simulation.totals.susceptible,
            this.simulation.totals.infected,
            this.simulation.totals.recovered,
            this.simulation.totals.deceased,
            this.simulation.totals.testsConducted,
            this.simulation.totals.daysLost,
        )
        //simulation.update();

        setDayData(this.chart_config, t,    
            this.simulation.totals.deceased/this.simulation.simulationParameters.populationSize * 100.0,
            this.simulation.totals.infected/this.simulation.simulationParameters.populationSize * 100.0,
            this.simulation.totals.recovered/this.simulation.simulationParameters.populationSize * 100.0,
            this.simulation.totals.susceptible/this.simulation.simulationParameters.populationSize * 100.0,
            );
        
        if (timeout != 0 ) {
            this.line_chart.update();
            this.line_chart.render();
            setTimeout(() => { this.tickSimulation(t+1) }, timeout);
        }
    }

    start(timeout=5) {
        this.running = true;
        if (timeout !=0){
            this.tickSimulation(0);   
        } else {
            var t=0;
            while(this.running) {
                this.tickSimulation(t++,0);
            }
            this.line_chart.update();
            this.line_chart.render();
        }
    }

<<<<<<< HEAD
    stop() {
        this.running = false;
    }
=======
>>>>>>> allow simulation to be updated without changing chart.  Added non-animated using start(0)

    resetData() {
        resetData(this.chart_config, this.steps);
    }
}