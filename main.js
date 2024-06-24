function randomNumberInRange(min, max) {
    // range: [min, max]
    return Math.random() * (max - min) + min;
}

function randomIntInRange(min, max) {
    // range: [min, max]
    return Math.round(randomNumberInRange(min, max));
}

function cellWidth(canvas, gridSize) {
    return canvas.width / gridSize;
} 

function cellHeight(canvas, gridSize) {
    return canvas.height / gridSize;
}

function drawGrid(canvas, ctx, gridSize) {
    ctx.beginPath();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += cellWidth(canvas, gridSize)) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += cellHeight(canvas, gridSize)) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }

    ctx.strokeStyle = '#ddd'; // Color of the grid lines
    ctx.stroke();
}

function cellPositions(gridSize) {
    let positions = []
    for (let x = 0; x < gridSize; ++x) {
        for (let y = 0; y < gridSize; ++y) {
            positions.push({x: x, y: y});
        }
    }
    return positions;
}

function validPosition(gridSize, position) {
    return position.x > -1 && position.x < gridSize && position.y > -1 && position.y < gridSize;
}

function resetVacuum(position = {x: 0, y: 0}) {
    return {
        position: {
            x: position.x,
            y: position.y
        }
    };
}

function drawVacuum(canvas, ctx, gridSize, vacuum) {
    const width = cellWidth(canvas, gridSize);
    const height = cellHeight(canvas, gridSize);
    ctx.fillStyle = 'gray';
    ctx.fillRect(vacuum.position.x * width, vacuum.position.y * height, width, height);
}

function resetDirt(gridSize, ratioCovered = 0.3) {
    const totalCoveredCells = Math.round(gridSize * gridSize * ratioCovered);
    let availableCells = cellPositions(gridSize);
    let dirtCells = [];
    
    for (let _ = 0; _ < totalCoveredCells; ++_) {
        const cellIdx = randomIntInRange(0, availableCells.length-1);
        dirtCells.push(availableCells.at(cellIdx));
        availableCells.splice(cellIdx, 1);
    }
    return dirtCells;
}

function drawDirt(canvas, ctx, gridSize, dirt) {
    const width = cellWidth(canvas, gridSize);
    const height = cellHeight(canvas, gridSize);

    ctx.fillStyle = '#8B4513';
    for (let dirtPosition of dirt) {
        ctx.fillRect(dirtPosition.x * width, dirtPosition.y * height, width, height);
    }
}

function equalPositions(pos0, pos1) {
    return (pos0.x === pos1.x) && (pos0.y === pos1.y);
}

function abovePosition(currentPosition) {
    return {x: currentPosition.x, y: currentPosition.y - 1};
}

function belowPosition(currentPosition) {
    return {x: currentPosition.x, y: currentPosition.y + 1 };
}

function leftPosition(currentPosition) {
    return {x: currentPosition.x - 1, y: currentPosition.y};
}

function rightPosition(currentPosition) {
    return {x: currentPosition.x + 1, y: currentPosition.y};
}

function validNextPositions(gridSize, currentPosition) {
    let positions = []
    const funs = [abovePosition, belowPosition, leftPosition, rightPosition];
    for (let i = 0; i < funs.length; ++i) {
        const nextPosition = funs[i](currentPosition);
        if (validPosition(gridSize, nextPosition)) positions.push(nextPosition);
    }
    return positions;
}

function attemptNoMovement(state) {
    return state.vacuum.position;
}

function attempUpMovement(state) {
    const nextPossiblePosition = abovePosition(state.vacuum.position);
    return validPosition(state.gridSize, nextPossiblePosition) ? nextPossiblePosition : state.vacuum.position;
}

function attemptDownMovement(state) {
    const nextPossiblePosition = belowPosition(state.vacuum.position);
    return validPosition(state.gridSize, nextPossiblePosition) ? nextPossiblePosition : state.vacuum.position;
}

function attemptLeftMovement(state) {
    const nextPossiblePosition = leftPosition(state.vacuum.position);
    return validPosition(state.gridSize, nextPossiblePosition) ? nextPossiblePosition : state.vacuum.position;
}

function attemptRightMovement(state) {
    const nextPossiblePosition = rightPosition(state.vacuum.position);
    return validPosition(state.gridSize, nextPossiblePosition) ? nextPossiblePosition : state.vacuum.position;
}

const UP_ACTION = "UP";
const DOWN_ACTION = "DOWN";
const LEFT_ACTION = "LEFT";
const RIGHT_ACTION = "RIGHT";
const NO_ACTION = "";
const ACTIONS = [UP_ACTION, DOWN_ACTION, LEFT_ACTION, RIGHT_ACTION, NO_ACTION]

function nextPositionFromAction(state, action) {
    if (action === UP_ACTION) {
        return attempUpMovement(state);
    } else if (action === DOWN_ACTION) {
        return attemptDownMovement(state);
    } else if (action === LEFT_ACTION) {
        return attemptLeftMovement(state);
    } else if (action === RIGHT_ACTION) {
        return attemptRightMovement(state);
    } else if (action === NO_ACTION) {
        return attemptNoMovement(state);
    }

    throw `Unexpected action ${action} in nextPositionFromAction`;
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function step(state, action) {
    let nextState = deepCopy(state);

    nextState.vacuum.position = nextPositionFromAction(state, action);
    let foundIdx = undefined;
    for (let [idx, dirtPosition] of nextState.dirt.entries()) {
        if (equalPositions(dirtPosition, nextState.vacuum.position)) {
            foundIdx = idx;
            break;
        }
    }
    if (foundIdx !== undefined) {
        nextState.dirt.splice(foundIdx, 1);
    }

    return nextState;
}

function l1Distance(p0, p1) {
    return Math.abs(p0.x-p1.x) + Math.abs(p0.y-p1.y);
}

function logMessage(message) {
    const logDiv = document.getElementById('log');
    logDiv.textContent = ''; // Clear the log div content
    const newMessage = document.createElement('div');
    newMessage.textContent = message;
    logDiv.appendChild(newMessage);
}

function vacuumDistancesToDirt(state) {
    let distances = [];
    for (const dirtPosition of state.dirt) {
        distances.push(l1Distance(state.vacuum.position, dirtPosition));
    }
    return distances;
}

function isGoal(state) {
    return state.dirt.length == 0;
}

function novelActions(state) {
    // returns true if the action will lead to new state
    let acts = [];
    for (let action of ACTIONS) {
        if (!equalPositions(state.vacuum.position, nextPositionFromAction(state, action))) {
            acts.push(action);
        }
    }
    return acts;
}

function nearestDirt(state) {
    if (isGoal(state)) return NO_ACTION;
    const distancesToDirt = vacuumDistancesToDirt(state);
    const minDistance = Math.min(...distancesToDirt);
    const targetDirtPosition = state.dirt[distancesToDirt.findIndex((el) => el == minDistance)];

    if (state.vacuum.position.y > targetDirtPosition.y) {
        return UP_ACTION;
    } else if (state.vacuum.position.y < targetDirtPosition.y) {
        return DOWN_ACTION;
    } else if (state.vacuum.position.x > targetDirtPosition.x) {
        return LEFT_ACTION;
    } else {
        return RIGHT_ACTION;
    }
}

function expandNode(node, actions = ACTIONS) {
    const nextStates = [];
    for (let action of actions) {
        let nextState = step(node.state, action);
        nextState["action"] = action
        nextStates.push(nextState);
    }
    return nextStates;
}

function stateAsString(state) {
    let s = "";
    s += `(${state.vacuum.position.x},${state.vacuum.position.y}),`;
    for (let dirtPos of state.dirt) {
        s += `(${dirtPos.x},${dirtPos.y}),`;
    }
    return s;
}

function breadthFirstSearch(state, memory, timeout) {
    if (!("frontier" in memory)) {
        // Initialize state memory for the agent
        memory["frontier"] = [{state: state, actions: []}];
        memory["visited"] = new Set();
        memory.visited.add(stateAsString(memory.frontier[0].state));
        memory["searchCount"] = 0;
    } else if ("actions" in memory) {
        // We've found a path, start executing it.
        if (memory.actions.length > 0) {
            let nextAction = memory.actions.shift();
            return nextAction;
        }
        return NO_ACTION;
    }

    const startTimestamp = new Date().getTime();
    let completedIterations = 0;
    while (memory.frontier.length > 0 && (new Date().getTime() - startTimestamp) < timeout) {
        let curr = memory.frontier.shift();
        memory.searchCount += 1;

        if (isGoal(curr.state)) {
            logMessage(`Found solution at ${memory.searchCount} searched nodes`);
            console.log(`Found solution: ${curr.actions}`);
            memory["actions"] = curr.actions;
            let nextAction = memory.actions.shift();
            return nextAction;
        }

        for (let nextState of expandNode(curr, novelActions(curr.state))) {
            let neighbor = {state: nextState, actions: curr.actions.concat(nextState.action)};
            let neighborStateString = stateAsString(neighbor.state);
            if (!memory.visited.has(neighborStateString)) {
                memory.frontier.push(neighbor);
                memory.visited.add(neighborStateString);
            }
        }

        completedIterations += 1;
    }
    
    logMessage(`Searched ${memory.searchCount} nodes...`);
    console.log(`Completed ${completedIterations} iterations of search...`);
    return NO_ACTION;
}

function depthFirstSearch(state, memory, timeout) {
    if (!("frontier" in memory)) {
        // Initialize state memory for the agent
        memory["frontier"] = [{state: state, actions: []}];
        memory["visited"] = new Set();
        memory.visited.add(stateAsString(memory.frontier[0].state));
        memory["searchCount"] = 0;
    } else if ("actions" in memory) {
        // We've found a path, start executing it.
        if (memory.actions.length > 0) {
            let nextAction = memory.actions.shift();
            return nextAction;
        }
        return NO_ACTION;
    }

    const startTimestamp = new Date().getTime();
    let completedIterations = 0;
    while (memory.frontier.length > 0 && (new Date().getTime() - startTimestamp) < timeout) {
        let curr = memory.frontier.pop();
        memory.searchCount += 1;

        if (isGoal(curr.state)) {
            logMessage(`Found solution at ${memory.searchCount} searched nodes`);
            console.log(`Found solution: ${curr.actions}`);
            memory["actions"] = curr.actions;
            let nextAction = memory.actions.shift();
            return nextAction;
        }

        for (let nextState of expandNode(curr, novelActions(curr.state))) {
            let neighbor = {state: nextState, actions: curr.actions.concat(nextState.action)};
            let neighborStateString = stateAsString(neighbor.state);
            if (!memory.visited.has(neighborStateString)) {
                memory.frontier.push(neighbor);
                memory.visited.add(neighborStateString);
            }
        }

        completedIterations += 1;
    }
    
    logMessage(`Searched ${memory.searchCount} nodes...`);
    console.log(`Completed ${completedIterations} iterations of search...`);
    return NO_ACTION;
}

class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    length() {
        return this.elements.length;
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        this.elements.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.elements.shift().element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}

function nearestNeighborHeuristic(start, dirtPositions) {
    let totalDistance = 0;
    let current = start;
    const unvisited = new Set(dirtPositions);

    while (unvisited.size > 0) {
        let nearest = null;
        let nearestDistance = Infinity;
        for (const pos of unvisited) {
            const distance = l1Distance(current, pos);
            if (distance < nearestDistance) {
                nearest = pos;
                nearestDistance = distance;
            }
        }
        totalDistance += nearestDistance;
        current = nearest;
        unvisited.delete(nearest);
    }

    return totalDistance;
}

function aStarSearch(state, memory, timeout) {
    if (!("frontier" in memory)) {
        // Initialize state memory for the agent
        const node = {state: state, actions: []};
        memory["frontier"] = new PriorityQueue();
        memory.frontier.enqueue(node, 0);
        memory["visited"] = new Set();
        memory.visited.add(stateAsString(node.state));
        memory["searchCount"] = 0;
    } else if ("actions" in memory) {
        // We've found a path, start executing it.
        if (memory.actions.length > 0) {
            let nextAction = memory.actions.shift();
            return nextAction;
        }
        return NO_ACTION;
    }

    const startTimestamp = new Date().getTime();
    let completedIterations = 0;
    while (memory.frontier.length() > 0 && (new Date().getTime() - startTimestamp) < timeout) {
        let curr = memory.frontier.dequeue();
        memory.searchCount += 1;

        if (isGoal(curr.state)) {
            logMessage(`Found solution at ${memory.searchCount} searched nodes`);
            console.log(`Found solution: ${curr.actions}`);
            memory["actions"] = curr.actions;
            let nextAction = memory.actions.shift();
            return nextAction;
        }

        for (let nextState of expandNode(curr, novelActions(curr.state))) {
            let neighbor = {state: nextState, actions: curr.actions.concat(nextState.action)};
            let neighborStateString = stateAsString(neighbor.state);
            if (!memory.visited.has(neighborStateString)) {
                // TODO for now using hardcoded heuristic, but could take it as arg
                // TODO also not sure if this visited check is complete
                const priority = neighbor.actions.length + nearestNeighborHeuristic(neighbor.state.vacuum.position, neighbor.state.dirt);
                memory.frontier.enqueue(neighbor, priority);
                memory.visited.add(neighborStateString);
            }
        }

        completedIterations += 1;
    }
    
    logMessage(`Searched ${memory.searchCount} nodes...`);
    console.log(`Completed ${completedIterations} iterations of search...`);
    return NO_ACTION;
}

const agents = {
    goUp: (_) => UP_ACTION,
    goDown: (_) => DOWN_ACTION,
    goLeft: (_) => LEFT_ACTION,
    goRight: (_) => RIGHT_ACTION,
    randomMovement: (_) => ACTIONS.at(randomIntInRange(0, ACTIONS.length-1)),
    nearestDirt: nearestDirt,
    breadthFirstSearch: breadthFirstSearch,
    depthFirstSearch: depthFirstSearch,
    aStarSearch: aStarSearch
};

function draw(canvas, ctx, state) {
    drawGrid(canvas, ctx, state.gridSize);
    drawDirt(canvas, ctx, state.gridSize, state.dirt);
    drawVacuum(canvas, ctx, state.gridSize, state.vacuum);
}

function resetState(gridSize, dirtCoverageRatio) {
    return {
        gridSize: gridSize,
        vacuum: resetVacuum(),
        dirt: resetDirt(gridSize, dirtCoverageRatio)
    };
}

window.onload = function() {
    const canvas = document.getElementById('worldCanvas');
    const ctx = canvas.getContext('2d');


    const agentSelectionInput = document.getElementById('agentSelection');
    const gridSizeInput = document.getElementById('gridSizeInput');
    const dirtCoveragePercentageInput = document.getElementById('dirtCoveragePercentageInput');
    const timeBetweenUpdatesInput = document.getElementById('timeBetweenUpdatesInput');
    const resetButton = document.getElementById("resetButton");
    const playPauseButton = document.getElementById('playPauseButton');
    
    let dirtCoverageRatio = parseInt(dirtCoveragePercentageInput.value) / 100.0;
    let lastTimestamp = 0;
    let isPaused = true;
    let timeBetweenUpdates = parseInt(timeBetweenUpdatesInput.value); // milliseconds
    let agent = agents[agentSelectionInput.value];
    let state = resetState(parseInt(gridSizeInput.value));
    let memory = {};

    function reset(newGridSize = undefined) {
        state = resetState(newGridSize === undefined ? state.gridSize : newGridSize, dirtCoverageRatio);
        memory = {};
        draw(canvas, ctx, state);
    }

    function resizeCanvas() {
        if (window.innerWidth < 768) {
            // Mobile dimensions
            canvas.width = 300;
            canvas.height = 150;
        } else {
            // Desktop dimensions
            canvas.width = 800;
            canvas.height = 400;
        }

        reset();
    }

    // Resize the canvas when the window is resized
    window.addEventListener('resize', resizeCanvas);

    agentSelectionInput.addEventListener('change', function() {
        const newAgentSelection = agentSelectionInput.value;
        if (newAgentSelection in agents) {
            agent = agents[newAgentSelection];
            reset();
        }
        else {
            console.log(`unexpected agentSelection: ${newAgentSelection}`);
        }
    });

    gridSizeInput.addEventListener('input', function() {
        const newGridSize = parseInt(gridSizeInput.value);
        if (!isNaN(newGridSize)) {
            console.log(`Setting gridSize from ${state.gridSize} to ${newGridSize}`)
            reset(newGridSize);
        }
    });

    dirtCoveragePercentageInput.addEventListener('input', function() {
        const newDirtCoverageRatio = parseInt(dirtCoveragePercentageInput.value) / 100.0;
        if (!isNaN(newDirtCoverageRatio)) {
            console.log(`Setting dirtCoverageRatio from ${dirtCoverageRatio} to ${newDirtCoverageRatio}`)
            dirtCoverageRatio = newDirtCoverageRatio;
            reset();
        }
    })

    timeBetweenUpdatesInput.addEventListener('input', function() {
        const newTimeBetweenUpdates = parseInt(timeBetweenUpdatesInput.value);
        if (!isNaN(newTimeBetweenUpdates)) {
            console.log(`Setting timeBetweenUpdates from ${timeBetweenUpdates} to ${newTimeBetweenUpdates}`)
            timeBetweenUpdates = newTimeBetweenUpdates;
        }
    });
    
    resetButton.addEventListener('click', function() {
        reset();
    });

    playPauseButton.addEventListener('click', function() {
        isPaused = !isPaused;
        playPauseButton.textContent = isPaused ? 'Play' : 'Pause';
    });

    function animate(timestamp) {
        if (!isPaused && (timestamp - lastTimestamp > timeBetweenUpdates)) {
            lastTimestamp = timestamp;
            // TODO technically we aren't actually enforcing timeBetweenUpdates
            // as we provide it as a timeout below, so we are actually waiting
            // timeBetweenUpdates + (time to call step/draw below) at a minimum
            // if the agent times out for this iter. We could change the name
            // but isn't a super big deal rn. :) 
            const action = agent(state, memory, timeBetweenUpdates);
            console.log(`action=${action}`);
            state = step(state, action);
            draw(canvas, ctx, state);
        }
        requestAnimationFrame(animate);
    }

    resizeCanvas();
    requestAnimationFrame(animate);
};

