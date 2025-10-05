const GRID_SIZE = 40;
const GRID_ELEMENTS = [];
const GRID_STATE = [];
const BALLS = [];
const HUE = 180;
const POS_COLOR = `hsla(${HUE}, 100%, 20%, 1.00)`;
const NEG_COLOR = `hsla(${(HUE) % 360}, 100%, 90%, 1.00)`;
const FRAME_DURATION = 1000 / 60; // 60 FPS
const BALL_SPEED = 0.3; // Grid squares per second
const BALL_RADIUS = 0.3; // In grid squares
const NUM_EACH_TYPE = 10;
const NUM_TIME_SUBSTEPS = 1;

// Set CSS variables for grid size and colors
document.body.style.setProperty('--num-grid-squares', GRID_SIZE);
document.body.style.setProperty('--positive-color', POS_COLOR);
document.body.style.setProperty('--negative-color', NEG_COLOR);
document.body.style.setProperty('--ball-radius', BALL_RADIUS);

const createGridSquare = (x, y) => {
    const square = document.createElement('div');
    square.classList.add('grid-square');
    square.dataset.x = x;
    square.dataset.y = y;
    return square;
};

const getGridSquare = (x, y) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
        return null;
    }
    return GRID_ELEMENTS[y][x];
};

const initializeGrid = () => {
    const container = document.getElementById('grid-container');
    for (let y = 0; y < GRID_SIZE; y++) {
        GRID_ELEMENTS[y] = [];
        GRID_STATE[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            const square = createGridSquare(x, y);
            container.appendChild(square);
            GRID_ELEMENTS[y][x] = square;
            GRID_STATE[y][x] = (x > GRID_SIZE / 2) ? 1 : -1;
        }
    }
};

const getGridStateAt = (x, y) => {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
        return null;
    }
    return GRID_STATE[y][x];
};

const toggleGridStateAt = (x, y) => {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
        return;
    }
    GRID_STATE[y][x] *= -1;
};

const getGridColorAt = (x, y) => {
    return getGridStateAt(x, y) > 0 ? POS_COLOR : NEG_COLOR;
};

const updateGridColors = (fullUpdate) => {
    if (fullUpdate) {
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let y = 0; y < GRID_SIZE; y++) {
                const square = getGridSquare(x, y);
                if (square) {
                    square.style.backgroundColor = getGridColorAt(x, y);
                }
            }
        }
    } else {
        BALLS.forEach(ball => {
            const gridX = Math.floor(ball.px);
            const gridY = Math.floor(ball.py);
            for (let y = gridY - 2; y <= gridY + 2; y++) {
                for (let x = gridX - 2; x <= gridX + 2; x++) {
                    const square = getGridSquare(x, y);
                    if (square) {
                        square.style.backgroundColor = getGridColorAt(x, y);
                    }
                }
            }
        });
    }
};

const initializeBalls = () => {


    for (let i = 0; i < NUM_EACH_TYPE; i++) {
        const ballPositive = document.createElement('div');
        ballPositive.classList.add('ball');
        const bpPx = Math.random() * GRID_SIZE / 2;
        const bpPy = Math.random() * GRID_SIZE;
        ballPositive.style.setProperty('--pos-x', bpPx);
        ballPositive.style.setProperty('--pos-y', bpPy);
        ballPositive.style.setProperty('--ball-color', POS_COLOR);
        document.body.appendChild(ballPositive);
        BALLS.push({
            px: bpPx,
            py: bpPy,
            vtheta: Math.random() * 2 * Math.PI,
            element: ballPositive,
            state: -1
        });

        const ballNegative = document.createElement('div');
        ballNegative.classList.add('ball');
        const bnPx = Math.random() * GRID_SIZE / 2 + GRID_SIZE / 2;
        const bnPy = Math.random() * GRID_SIZE;
        ballNegative.style.setProperty('--pos-x', bnPx);
        ballNegative.style.setProperty('--pos-y', bnPy);
        ballNegative.style.setProperty('--ball-color', NEG_COLOR);
        document.body.appendChild(ballNegative);
        BALLS.push({
            px: bnPx,
            py: bnPy,
            vtheta: Math.random() * 2 * Math.PI,
            element: ballNegative,
            state: 1
        });
    }
};

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);


let lastTimestamp = null;
const gameLoop = (timestamp) => {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = (timestamp - lastTimestamp) / NUM_TIME_SUBSTEPS;

    for (let step = 0; step < NUM_TIME_SUBSTEPS; step++) {

        // Update ball positions based on their velocities
        BALLS.forEach(ball => {
            const newPx = ball.px + Math.cos(ball.vtheta) * BALL_SPEED * (delta / FRAME_DURATION);
            const newPy = ball.py + Math.sin(ball.vtheta) * BALL_SPEED * (delta / FRAME_DURATION);
            if (newPx > BALL_RADIUS && newPx < GRID_SIZE - BALL_RADIUS && newPy > BALL_RADIUS && newPy < GRID_SIZE - BALL_RADIUS) {
                // Check for collisions with opposite grid state if we're firmly inside the grid
                for (let testTheta = 0; testTheta < 2 * Math.PI; testTheta += Math.PI / 4) {
                    const testPx = ball.px + Math.cos(testTheta) * BALL_RADIUS;
                    const testPy = ball.py + Math.sin(testTheta) * BALL_RADIUS;

                    if (getGridStateAt(testPx, testPy) !== ball.state) {
                        const isHorizontal = (Math.abs(Math.cos(testTheta)) > Math.abs(Math.sin(testTheta)));
                        if (isHorizontal) {
                            ball.vtheta = Math.PI - ball.vtheta;
                        } else {
                            ball.vtheta = -ball.vtheta;
                        }
                        toggleGridStateAt(testPx, testPy);
                        break; // Only handle one collision per frame
                    }
                }
            }


            //find new ball centers
            if (getGridStateAt(newPx + BALL_RADIUS, newPy) !== ball.state) {
                ball.vtheta = Math.PI - ball.vtheta;
                toggleGridStateAt(newPx + BALL_RADIUS, newPy);
            } else if (getGridStateAt(newPx - BALL_RADIUS, newPy) !== ball.state) {
                ball.vtheta = Math.PI - ball.vtheta;
                toggleGridStateAt(newPx - BALL_RADIUS, newPy);
            } else if (getGridStateAt(newPx, newPy + BALL_RADIUS) !== ball.state) {
                ball.vtheta = -ball.vtheta;
                toggleGridStateAt(newPx, newPy + BALL_RADIUS);
            } else if (getGridStateAt(newPx, newPy - BALL_RADIUS) !== ball.state) {
                ball.vtheta = -ball.vtheta;
                toggleGridStateAt(newPx, newPy - BALL_RADIUS);
            }

            updateGridColors(false);
            ball.px = clamp(ball.px + Math.cos(ball.vtheta) * BALL_SPEED * (delta / FRAME_DURATION), 0 + BALL_RADIUS + 0.01, GRID_SIZE - BALL_RADIUS - 0.01);
            ball.py = clamp(ball.py + Math.sin(ball.vtheta) * BALL_SPEED * (delta / FRAME_DURATION), 0 + BALL_RADIUS + 0.01, GRID_SIZE - BALL_RADIUS - 0.01);
        });
    }

    BALLS.forEach(ball => {
        ball.element.style.setProperty('--pos-x', ball.px);
        ball.element.style.setProperty('--pos-y', ball.py);
    });

    lastTimestamp = timestamp;
    requestAnimationFrame(gameLoop);
};