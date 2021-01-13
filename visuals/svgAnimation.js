
/**
 * Ball object - multiple balls can be created by instantiating new objects
 */
function Ball(svg, x, y, id, color, direction, radius) {
    this.setup = { svg, x, y, id, color, direction, radius };
    this.posX      = x;
    this.posY      = y;
    this.color     = color;
    this.radius    = radius;
    this.speed     = 1;
    this.svg       = svg; // parent SVG
    this.id        = id;
    this.direction = direction;

    if (!this.direction) {
        this.direction = Math.PI / 7;
    }
    if (!this.radius) {
        this.radius = 10;
    }

    this.data = [this.id]; // allow us to use d3.enter()

    const self = this;

    // Direction and speed together is velocity
    this.vx = Math.cos(self.direction) * self.speed;
    this.vy = Math.sin(self.direction) * self.speed;
    this.initialVx   = this.vx;
    this.initialVy   = this.vy;
    this.initialPosX = this.posX;
    this.initialPosY = this.posY;

    // When speed changes, go to initial setting
    this.GoToInitialSettings = function (newSpeed) {
        self.posX = self.initialPosX;
        self.posY = self.initialPosY;
        self.vx = Math.cos(self.direction) * newSpeed;
        self.vy = Math.sin(self.direction) * newSpeed;
        self.Draw();
    }

    this.Draw = function () {
        const svg = self.svg;
        let ball = svg
            .selectAll(`#${self.id}`)
            .data(self.data);

        ball.enter()
            // .merge(ball)
            .append('circle')
            .attr({ 'id' : self.id, 'class' : 'ball', 'r' : self.radius })
            .style('fill', self.color);

        ball.attr('cx', self.posX)
            .attr('cy', self.posY);

        // Intersect ball is used to show collision effect - every ball has it's own intersect ball
        let intersectBall = ball
            .enter()
            .append('circle')
            .attr({ 'id': `${self.id}_intersect`, 'class': 'intersectBall' });
    }

    this.Move = function () {
        const svg = self.svg;
        self.posX += self.vx;
        self.posY += self.vy;

        if (parseInt(svg.attr('width')) <= (self.posX + self.radius)) {
            self.posX = parseInt(svg.attr('width')) - self.radius - 1;
            self.direction = Math.PI - self.direction;
            self.vx = -self.vx;
        }

        if (self.posX < self.radius) {
            self.posX = self.radius+1;
            self.direction = Math.PI - self.direction;
            self.vx = -self.vx;
        }

        if (parseInt(svg.attr('height')) < (self.posY + self.radius)) {
            self.posY = parseInt(svg.attr('height')) - self.radius - 1;
            self.direction = 2 * Math.PI - self.direction;
            self.vy = -self.vy;
        }

        if (self.posY < self.radius) {
            self.posY = self.radius+1;
            self.direction = 2 * Math.PI - self.direction;
            self.vy = -self.vy;
        }

        if (self.direction > 2 * Math.PI) {
            self.direction = self.direction - 2 * Math.PI;
        }
        if (self.direction < 0) {
            self.direction = 2 * Math.PI + self.direction;
        }

        self.Draw();
    }
}

/**
 * Checks whether or not two of the balls have had a collision.
 */
function CheckCollision(ball1, ball2) {
    let absx = Math.abs(parseFloat(ball2.posX) - parseFloat(ball1.posX));
    let absy = Math.abs(parseFloat(ball2.posY) - parseFloat(ball1.posY));

    // Find distance between two balls.
    let distance = Math.sqrt((absx * absx) + (absy * absy));
    // Check if distance is less than sum of two radius - if yes, collision!
    if (distance < (parseFloat(ball1.radius) + parseFloat(ball2.radius))) {
        return true;
    }
    return false;
}

let balls = []; // global array representing balls
let color = 'blue'; // d3.scale.category20();

/**
 * Handles a collision event by updating the two actors' direction and velocity, and
 * creates a collision marker that fades out.
 */
function ProcessCollision(ball1, ball2) {
    if (ball2 <= ball1) {
        return;
    }
    if (ball1 >= (balls.length-1) || ball2 >= balls.length) {
        return;
    }

    ball1 = balls[ball1];
    ball2 = balls[ball2];

    if (CheckCollision(ball1, ball2)) {
        // Intersection point
        let interx = ((ball1.posX * ball2.radius) + ball2.posX * ball1.radius)
            / (ball1.radius + ball2.radius);
        let intery = ((ball1.posY * ball2.radius) + ball2.posY  * ball1.radius)
            / (ball1.radius + ball2.radius);

        // Show collision effect for 500 miliseconds
        let intersectBall = svg.select(`#${ball1.id}_intersect`);
        intersectBall
            .attr({ 'cx': interx, 'cy': intery, 'r': 4, 'fill': COLORS.NEUTRAL })
            .transition()
            .duration(500)
            .attr('r', 0);

        // Calculate new velocity of each ball.
        let vx1 = (ball2.vx);
        let vy1 = (ball2.vy);
        let vx2 = (ball1.vx);
        let vy2 = (ball1.vy);

        // Set velocities for both balls
        ball1.vx = vx1;
        ball1.vy = vy1;
        ball2.vx = vx2;
        ball2.vy = vy2;

        // Ensure one ball is not inside others. distant apart till not colliding
        while (CheckCollision(ball1, ball2)) {
            ball1.posX += ball1.vx;
            ball1.posY += ball1.vy;

            ball2.posX += ball2.vx;
            ball2.posY += ball2.vy;
        }
        ball1.Draw();
        ball2.Draw();
    }
}

/**
 * Performs the initial setup of the animation for the given page element by `elementId`.
 */
function Initialize(elementId) {
    let height   = document.getElementById(elementId).clientHeight;
    let width    = document.getElementById(elementId).clientWidth;
    gCanvasId    = elementId + '_canvas';
    gTopGroupId  = elementId + '_topGroup';

    let svg = d3
        .select(`#${elementId}`)
        .append("svg")
        .attr("id", gCanvasId)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("id", gTopGroupId)
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none");

    for (let i = 0; i < COUNT; i++) {
        balls.push(new Ball(
            svg,
            between(40, width - 40),
            between(40, height - 40),
            `n${i}`,
            COLORS.BLUE,
            Math.PI / Math.floor(between(1, 10)),
            6
        ));
    }

    for (let i = 0; i < balls.length; ++i) {
        balls[i].Draw();
    }
    return svg;
}

let running = false;

function StartStopVisual() {
    console.log('Visual: Starting visualization animation...');
    if (running == false) {
        d3.timer(function () {
            for (let i = 0; i < balls.length; ++i) {
                balls[i].Move();
                for (let j = i + 1; j < balls.length; ++j) {
                    ProcessCollision(i, j);
                }
            }
            if (running == false) { return true; }
            else { return false; }
        }, 500);
        running = true;
    } else {
        running = false;
    }
}

// Handle ESC key
d3.select('body')
    .on('keydown', function () {
        if (balls.length == 0) {
            return;
        }
        // If ESC key - toggle start/stop
        if (d3.event.keyCode == 27) {
            StartStopVisual();
        }
    });
