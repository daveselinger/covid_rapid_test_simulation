/** An enum containing the color scheme for the visualization. */
const COLORS = {
    BLUE:       '#1070CA',
    TEAL:       '#14B5D0',
    YELLOW:     '#F7D154',
    ORANGE:     '#D9822B',
    PURPLE:     '#735DD0',
    RED:        '#EC4C47',
    GREEN:      '#47B881',
    NEUTRAL:    '#425A70',
    DARK:       '#234361',
    REALLY_DRK: '#0F2C44',
    LIGHT:      '#E4E7EB',
    XLIGHT:     '#F5F6F7',
    WHITE:      '#FFF',

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

/**
 * Quantized color spectrum based on progression through different stages.
 */
const COLOR_SPECTRUM = {
    EXPOSED: [
        '#1171ca', // 0
        '#2279c1', // 1
        '#3883b6', // 2
        '#508faa', // 3
        '#6e9e9b', // 4
        '#8bac8d', // 5
        '#a9ba7d', // 6
        '#c6c56f', // 7
        '#dfce61', // 8
        '#f0d158', // 9
        '#f7d051', // 10
        '#f7c84c', // 11
        '#f7bd48', // 12
        '#f7af47', // 13
        '#f79c47', // 14
        '#f78d47', // 15
        '#f77c47', // 16
        '#f76b47', // 17
        '#f75d47', // 18
        '#f65247', // 19
        '#f45147'  // 20
    ],
    INFECTIOUS: [
        '#f34f47', // 1
        '#ec4c47', // 2
        '#df4f4b', // 3
        '#d6524d', // 4
        '#ce5650', // 5
        '#c45c53', // 6
        '#ba6257', // 7
        '#af695b', // 8
        '#a3725f', // 9
        '#987a64', // 10
        '#8e8267', // 11
        '#828b6b', // 12
        '#77936f', // 13
        '#6d9b73', // 14
        '#65a276', // 15
        '#5ba97a', // 16
        '#54af7d', // 17
        '#4db47f', // 18
        '#48b881', // 19
        '#47b881'  // 20
    ],
}

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
