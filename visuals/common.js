/** An enum containing the color scheme for the visualization. */
const COLORS = {
    BLUE:    '#1070CA',
    TEAL:    '#14B5D0',
    YELLOW:  '#F7D154',
    ORANGE:  '#D9822B',
    RED:     '#EC4C47',
    GREEN:   '#47B881',
    NEUTRAL: '#425A70',
    DARK:    '#234361',
    LIGHT:   '#E4E7EB',

    // Neutral scale
    N1:  '#F9F9FB',
    N2:  '#F5F6F7',
    N3:  '#EDF0F2',
    N4:  '#E4E7EB',
    N5:  '#C7CED4',
    N6:  '#A6B1BB',
    N7:  '#7B8B9A',
    N8:  '#66788A',
    N9:  '#425A70',
    N10: '#234361'
};

const COUNT = 20;


/**
 * A helper utility to add a delay to the execution.
 * @param {number} ms - The number of milliseconds to pause.
 */
const pause = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Picks a random integer between `min` and `max`.
 * @param {number} min - The minimum value (inclusive).
 * @param {number} max - The maximum value (inclusive).
 */
const between = (min = 0, max = 10) => Math.floor(Math.random() * (max - min) + min);
