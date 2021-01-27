
/**
 * Creates a canvas and draw a stacked area graph based on population results.
 */
class AreaGraph {

    /** How thick the stacked line should be for each interval. */
    lineWidth = 1;

    /** The value of the last step this graph was drawn on. */
    lastStep = 0;

    constructor(element, options = {}) {
        this.element = element;

        this.xLabel = options.xLabel || 'TIME';
        this.yLabel =  options.yLabel || 'POPULATION';

        // Bind this context
        this.drawXAxis = this.drawXAxis.bind(this);
        this.drawYAxis = this.drawYAxis.bind(this);
        this.draw = this.draw.bind(this);
        this.clear = this.clear.bind(this);
        this.init = this.init.bind(this);

        this.init();
    }

    init() {
        this.width = this.element.clientWidth || 500;
        this.height = this.element.clientHeight || 180;
        this.margin = { top: 0, right: 16, bottom: 16, left: 16 };
        this.innerWidth = this.width - this.margin.right - this.margin.left;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        const canvas = document.createElement('canvas');
        this.element.innerHTML = '';
        this.element.appendChild(canvas);
    
        // Style the canvas
        canvas.width = this.width;
        canvas.height = this.height;
        canvas.style.background = 'white';
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.context = canvas.getContext('2d', { alpha: false });

        this.clear();
        this.drawXAxis();
        this.drawYAxis();
    }

    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    drawYAxis() {
        this.context.save();
        const marginBottomOffset = Math.floor(this.margin.left / 2);
        const labelLength = (this.yLabel.length * 8);
        this.line(marginBottomOffset, 0, marginBottomOffset, this.height - marginBottomOffset, 1, COLORS.N6);
        this.context.fillStyle = COLORS.WHITE;
        this.context.fillRect(0, Math.floor((this.height / 2) - (labelLength / 2)), 20, labelLength);
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillStyle = COLORS.N6;
        this.context.translate(5, Math.floor(this.height / 2));
        this.context.rotate(270 * Math.PI / 180);
        this.context.fillText(this.yLabel, 0, 4);

        this.context.restore();
    }
      
    drawXAxis() {
        this.context.save();
        const marginLeftOffset = Math.floor(this.margin.left / 2);
        const marginBottomOffset = Math.floor(this.margin.bottom / 2);
        const labelLength = (this.xLabel.length * 12);
        this.line(marginLeftOffset, this.height - marginBottomOffset, this.width, this.height - marginBottomOffset, 1, COLORS.N6);
        this.context.fillStyle = COLORS.WHITE;
        this.context.fillRect(Math.floor((this.width / 2) - (labelLength / 2)), this.height - 10, labelLength, 20);
        this.context.font = 'bold 12px arial';
        this.context.textAlign = 'center';
        this.context.fillStyle = COLORS.N6;
        this.context.fillText(this.xLabel, Math.floor(this.width / 2), this.height - 4);
        this.context.restore();
    }

    /**
     * Draws an updated stacked graph based on the simulation and the percentage of the
     * population that falls in each category.
     * @param {number} step - The step in the progression (corresponds to change in x axis).
     * @param {Object} totals - The totals from the simulation.
     * @param {number} populationSize - The population size for this simulation.
     */
    draw(step, totals, populationSize) {
        const x = this.margin.left + (this.lastStep) + 1;
        if (x > this.innerWidth + this.margin.right) { return; }
        this.context.lineWidth = step - x;
        this.lastStep += this.context.lineWidth;
        let offset = 0;

        // Susceptible
        const noninfectious = this.innerHeight * (totals.susceptible / populationSize);
        this.line(x, 0, x, noninfectious, this.lineWidth + 1, COLORS.BLUE);
        offset += noninfectious;

        // Recovered
        const recovered = this.innerHeight * (totals.recovered / populationSize);
        this.line(x, offset, x, offset + recovered, this.lineWidth + 1, COLORS.GREEN);
        offset += recovered;

        // Infected
        const infected = this.innerHeight * (totals.infected / populationSize);
        this.line(x, offset, x, offset + infected, this.lineWidth + 1, COLORS.YELLOW);
        offset += infected;

        // Deceased
        const deceased = this.innerHeight * (totals.deceased / populationSize);
        this.line(x, offset, x, offset + deceased, this.lineWidth + 1, COLORS.NEUTRAL);
        offset += deceased;
    }

    /**
     * Simple function to draw a line from `x`, `y` to `x1`, `y1` with a given `lineWidth` and `color`.
     * @param {number} x - Starting x coordinate.
     * @param {number} y - Starting y coordinate.
     * @param {number} x1 - Ending x coordinate.
     * @param {number} y1 - Ending y coordinate.
     * @param {number} [lineWidth] - The width of the stroke to draw.
     * @param {string} [color] - A hex color value.
     */
    line(x, y, x1, y1, lineWidth = 1, color = '#000') {
        this.context.strokeStyle = color;
        this.context.lineWidth = lineWidth;
        this.context.beginPath();
        this.context.moveTo(x, y);
        this.context.lineTo(x1, y1);
        this.context.stroke();
    }

}
