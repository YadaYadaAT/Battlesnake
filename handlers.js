function info(idx = 0) {
  console.log('INFO');

  const snakeInfos = [
    {
      apiversion: '1',
      author: 'Anastasia',
      color: '#3E338F',
      head: 'smile',
      tail: 'default'
    },

    {
      apiversion: '1',
      author: 'SofiaLoukisa',
      color: '#FF0000',
      head: 'smile',
      tail: 'curled'
    },

    {
      apiversion: '1',
      author: 'SofiaKakou',
      color: '#00FF88',
      head: 'fang',
      tail: 'round-bum'
    },

    {
      apiversion: '1',
      author: 'Iro',
      color: '#3366FF',
      head: 'evil',
      tail: 'freckled'
    }
  ];

  return snakeInfos[idx];
}

function start(gameState) {
  console.log('GAME START');
}

function end(gameState) {
  console.log('GAME OVER\n');
}

function move(gameState) {
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  let possibleMoves = {
    up: { x: myHead.x, y: myHead.y + 1, safe: true },
    down: { x: myHead.x, y: myHead.y - 1, safe: true },
    left: { x: myHead.x - 1, y: myHead.y, safe: true },
    right: { x: myHead.x + 1, y: myHead.y, safe: true }
  };

  if (myNeck.x < myHead.x) {
    possibleMoves.left.safe = false;
  } else if (myNeck.x > myHead.x) {
    possibleMoves.right.safe = false;
  } else if (myNeck.y < myHead.y) {
    possibleMoves.down.safe = false;
  } else if (myNeck.y > myHead.y) {
    possibleMoves.up.safe = false;
  }

  // TODO: Step 1 - Prevent your Battlesnake from moving out of bounds
  // Task 1: if snake is at the edge of the board it tags the moves as unsafe
  if (possibleMoves.up.y >= gameState.board.height) {
    possibleMoves.up.safe = false;
  }
  if (possibleMoves.down.y < 0) {
    possibleMoves.down.safe = false;
  }
  if (possibleMoves.left.x < 0) {
    possibleMoves.left.safe = false;
  }
  if (possibleMoves.right.x >= gameState.board.width) {
    possibleMoves.right.safe = false;
  }
  // TODO: Step 2 - Prevent your Battlesnake from colliding with itself
  gameState.you.body.forEach((snakePart) => {
    Object.entries(possibleMoves).forEach(([direction, value]) => {
      if (value.x === snakePart.x && value.y === snakePart.y) {
        value.safe = false;
      }
    });
  });

  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  gameState.board.snakes.forEach((snake) => {
    snake.body.forEach((snakePart) => {
      Object.entries(possibleMoves).forEach(([direction, value]) => {
        if (value.x === snakePart.x && value.y === snakePart.y) {
          value.safe = false;
        }
      });
    });
  });

  //Iteration of Task 3 and 4, we don't need to check the tail bodypart of each snake
gameState.board.snakes.forEach((snake) => {
    const isMe = snake.id === gameState.you.id;

    snake.body.forEach((snakePart, idx, arr) => {
      const isTail = idx === arr.length - 1;

      Object.entries(possibleMoves).forEach(([direction, value]) => {
        const isSamePosition = value.x === snakePart.x && value.y === snakePart.y;

        if (!isMe && isTail) {
          // Check if this snake is likely to eat (tail won't move)
          const snakeHead = snake.body[0];

          const willEatFood = gameState.board.food.some(food => 
            (Math.abs(food.x - snakeHead.x) === 1 && food.y === snakeHead.y) ||
            (Math.abs(food.y - snakeHead.y) === 1 && food.x === snakeHead.x)
          );

          if (willEatFood && isSamePosition) {
            value.safe = false;
          }

          return; // Continue to next body part
        }

        // All other body parts (including own) are unsafe
        if (isSamePosition) {
          value.safe = false;
        }
      });
    });
  });

  // Check for potential head-to-head collisions with other snakes
  gameState.board.snakes.forEach((snake) => {
    // Skip if it's our own snake
    if (snake.id === gameState.you.id) {
      return;
    }

    // Get the other snake's head
    const otherHead = snake.body[0];
    const otherLength = snake.body.length;
    const myLength = gameState.you.body.length;

    // Check each possible move for potential head-to-head collision
    Object.entries(possibleMoves).forEach(([direction, value]) => {
      // Calculate potential head-to-head collision cells
      const potentialCollisions = [
        { x: otherHead.x + 1, y: otherHead.y }, // right
        { x: otherHead.x - 1, y: otherHead.y }, // left
        { x: otherHead.x, y: otherHead.y + 1 }, // up
        { x: otherHead.x, y: otherHead.y - 1 } // down
      ];

      // Check if our move would result in head-to-head collision
      potentialCollisions.forEach((cell) => {
        if (value.x === cell.x && value.y === cell.y) {
          // Mark move as unsafe if our snake is shorter or equal in length
          if (myLength <= otherLength) {
            value.safe = false;
            console.log(
              `Avoiding head-to-head with snake ${snake.id} - they are longer or equal in length`
            );
          }
        }
      });
    });
  });

  // Add hunting behavior
  const nearbySmallerSnakes = findNearbySmallerSnakes(gameState, myHead);
  
  // If we found smaller snakes nearby, prioritize hunting
  if (nearbySmallerSnakes.length > 0) {
    const targetSnake = nearbySmallerSnakes[0]; // Target the closest smaller snake
    
    // Evaluate each possible move for hunting effectiveness
    Object.entries(possibleMoves).forEach(([direction, move]) => {
      if (move.safe) {
        // Check if this move would be good for hunting
        if (isGoodHuntingMove(move, targetSnake, gameState)) {
          // Prioritize this move by adding a hunting score
          move.huntingScore = 1;
        } else {
          move.huntingScore = 0;
        }
      }
    });

    // Filter safe moves and sort by hunting score
    const safeMoves = Object.entries(possibleMoves)
      .filter(([_, move]) => move.safe)
      .sort(([_, a], [__, b]) => (b.huntingScore || 0) - (a.huntingScore || 0));

    if (safeMoves.length > 0) {
      const nextMove = safeMoves[0][0];
      console.log(`MOVE ${gameState.turn}: Hunting smaller snake! Moving ${nextMove}`);
      return { move: nextMove };
    }
  }

  // Are there any safe moves left?
  const safeMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key].safe
  );
  if (safeMoves.length == 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: 'down' };
  }

  // Choose a random move from the safe moves
  //   const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];

  // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
  // food = gameState.board.food;

  //Task 8, select next move using Manhattan distance
  let nextMove;
  if (!gameState.board.food.length) {
    nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    console.log('random next move');
  } else {
    const foods = gameState.board.food;
    foods.forEach((food) => {
      food.distanceX = Math.abs(myHead.x - food.x);
      const xDirection = myHead.x - food.x < 0 ? 'right' : 'left';
      food.distanceY = Math.abs(myHead.y - food.y);
      const yDirection = myHead.y - food.y < 0 ? 'up' : 'down';
      if (food.distanceX < food.distanceY) {
        if (food.distanceX === 0) {
          food.primaryDirection = yDirection;
          food.secondaryDirection = 'none';
        } else {
          food.primaryDirection = xDirection;
          food.secondaryDirection = yDirection;
        }
      } else {
        if (food.distanceY === 0) {
          food.primaryDirection = xDirection;
          food.secondaryDirection = 'none';
        } else {
          food.primaryDirection = yDirection;
          food.secondaryDirection = xDirection;
        }
      }
    });
    //We sort the foods by the distance to our snake's head
    foods.sort(
      (a, b) => a.distanceX + a.distanceY - (b.distanceX + b.distanceY)
    );
    //The closest food is the one we can move towards, not the one that is physically closest to us
    const closestFood = foods.find(
      (food) =>
        safeMoves.includes(food.primaryDirection) ||
        safeMoves.includes(food.secondaryDirection)
    );
    if (closestFood) {
      nextMove = safeMoves.includes(closestFood.primaryDirection)
        ? closestFood.primaryDirection
        : closestFood.secondaryDirection;
      console.log(safeMoves, myHead, closestFood);
    } else {
      //No foods in the direction that is safe to move to, we move randomly
      nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }
  }
  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}

function floodFill(board, start) {
  const width = board.width;
  const height = board.height;
  const visited = new Set();
  const stack = [start];

  // Helper to create a unique key for each cell
  function key(x, y) {
    return `${x},${y}`;
  }

  // Check if cell is within bounds and not visited or blocked
  function isValid(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    if (visited.has(key(x, y))) return false;

    // Check if cell is occupied by any snake body
    for (const snake of board.snakes) {
      for (const part of snake.body) {
        if (part.x === x && part.y === y) {
          return false;
        }
      }
    }
    return true;
  }

  let area = 0;

  while (stack.length > 0) {
    const { x, y } = stack.pop();
    if (!isValid(x, y)) continue;

    visited.add(key(x, y));
    area++;

    // Add neighbors (up, down, left, right)
    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }

  return area;
}

/**
 * Finds nearby smaller snakes within a detection radius
 * @param {Object} gameState - The current game state
 * @param {Object} myHead - The head position of our snake
 * @param {number} detectionRadius - How far to look for smaller snakes
 * @returns {Array} Array of nearby smaller snakes with their positions and distances
 */
function findNearbySmallerSnakes(gameState, myHead, detectionRadius = 5) {
  const nearbySnakes = [];
  const myLength = gameState.you.body.length;

  gameState.board.snakes.forEach((snake) => {
    // Skip if it's our own snake
    if (snake.id === gameState.you.id) return;

    // Skip if the snake is longer or equal in length
    if (snake.body.length >= myLength) return;

    const snakeHead = snake.body[0];
    const distance = Math.abs(snakeHead.x - myHead.x) + Math.abs(snakeHead.y - myHead.y);

    // Only consider snakes within detection radius
    if (distance <= detectionRadius) {
      nearbySnakes.push({
        snake,
        head: snakeHead,
        distance,
        // Calculate potential next positions of the smaller snake
        possibleNextMoves: calculatePossibleMoves(snakeHead, gameState.board)
      });
    }
  });

  // Sort by distance to prioritize closer snakes
  return nearbySnakes.sort((a, b) => a.distance - b.distance);
}

/**
 * Calculates possible moves for a given position
 * @param {Object} position - The position to calculate moves from
 * @param {Object} board - The game board
 * @returns {Object} Object containing safe possible moves
 */
function calculatePossibleMoves(position, board) {
  return {
    up: { x: position.x, y: position.y + 1, safe: true },
    down: { x: position.x, y: position.y - 1, safe: true },
    left: { x: position.x - 1, y: position.y, safe: true },
    right: { x: position.x + 1, y: position.y, safe: true }
  };
}

/**
 * Evaluates if a hunting move is safe and effective
 * @param {Object} move - The potential move to evaluate
 * @param {Object} targetSnake - The snake we're trying to hunt
 * @param {Object} gameState - The current game state
 * @returns {boolean} Whether the move is safe and good for hunting
 */
function isGoodHuntingMove(move, targetSnake, gameState) {
  // Check if move would get us closer to the target
  const currentDistance = Math.abs(move.x - targetSnake.head.x) + Math.abs(move.y - targetSnake.head.y);
  const myHead = gameState.you.body[0];
  const currentDistanceToTarget = Math.abs(myHead.x - targetSnake.head.x) + Math.abs(myHead.y - targetSnake.head.y);

  // Move is good if it gets us closer to the target
  return currentDistance < currentDistanceToTarget;
}

exports.info = info;
exports.start = start;
exports.move = move;
exports.end = end;
exports.floodFill = floodFill;


