class SimulationDisplay {
    simulation = null;
    line_chart = null;
    chart_config = null;

    simulation_step = -1;
    running = false;

    constructor (line_chart_element, parameters) {
        this.simulation = new Simulation(parameters);
        this.running = true;

        //Initialize chart
        var ctx = line_chart_element.getContext("2d");

        this.chart_config = initChart(500);
        this.line_chart = new Chart(ctx, this.chart_config);
        this.line_chart.options.animation = false; 
    }

    tickSimulation (t) {
        if (t==500 || !this.running) {
            console.log("End");
        }

        this.simulation.tick();

        console.log(this.simulation.tickCnt,
            this.simulation.totals.susceptible,
            this.simulation.totals.infected,
            this.simulation.totals.recovered,
            this.simulation.totals.deceased,
            this.simulation.totals.testsConducted,
            this.simulation.totals.daysLost,
        )
        //simulation.update();

        setDayData(this.chart_config, t,    
            this.simulation.totals.deceased/this.simulation.config.populationSize * 100.0,
            this.simulation.totals.infected/this.simulation.config.populationSize * 100.0,
            this.simulation.totals.recovered/this.simulation.config.populationSize * 100.0,
            this.simulation.totals.susceptible/this.simulation.config.populationSize * 100.0,
            );
        
        this.line_chart.update();
        this.line_chart.render();
        setTimeout(() => { this.tickSimulation(t+1) }, 20);
    }

    start() {
        this.tickSimulation(0);
    }

    

}