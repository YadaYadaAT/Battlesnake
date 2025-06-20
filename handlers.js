/**
 * Returns snake customization info based on index.
 * @param {number} [idx=0] - Index of the snake in the list.
 * @returns {Object} Snake info with appearance configuration.
 */
const { AStar } = require('./pathfinding');

function info(idx = 0) {
  console.log('INFO');
  const snakeInfos = [
    { apiversion: '1', author: 'Anastasia', color: '#3E338F', head: 'smile', tail: 'default' },
    { apiversion: '1', author: 'SofiaLoukisa', color: '#FF0000', head: 'smile', tail: 'curled' },
    { apiversion: '1', author: 'SofiaKakou', color: '#00FF88', head: 'fang', tail: 'round-bum' },
    { apiversion: '1', author: 'Iro', color: '#3366FF', head: 'evil', tail: 'freckled' }
  ];
  return snakeInfos[idx];
}

/**
 * Handles the start of the game.
 * @param {Object} gameState - The game state at the start.
 */
function start(gameState) {
  console.log('GAME START');
}

/**
 * Handles the end of the game.
 * @param {Object} gameState - The game state at the end.
 */
function end(gameState) {
  console.log('GAME OVER\n');
}

/**
 * Determines the next move based on the current game state.
 * @param {Object} gameState - The current game state provided by the Battlesnake engine.
 * @returns {{move: string}} The direction to move.
 */
function move(gameState) {
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];
  const myLength = gameState.you.body.length;
  
  // Calculate total board size for dynamic thresholds
  // This allows the snake to adapt its behavior based on map dimensions
  const boardSize = gameState.board.width * gameState.board.height;

  // Initialize A* pathfinder with the game board
  const pathfinder = new AStar(gameState.board);

  // Calculate dynamic thresholds based on board size
  // These thresholds scale with the map size to maintain appropriate behavior
  // on different board dimensions (small, standard, or large maps)
  const minSafeArea = Math.max(3, Math.floor(boardSize * 0.1));     // At least 3 cells or 10% of board
  const huntingThreshold = Math.max(50, Math.floor(boardSize * 0.2)); // Health threshold for hunting
  const foodPriorityThreshold = Math.max(30, Math.floor(boardSize * 0.15)); // Health threshold for food priority

  // Get all possible moves
  let possibleMoves = {
    up: { x: myHead.x, y: myHead.y + 1, safe: true },
    down: { x: myHead.x, y: myHead.y - 1, safe: true },
    left: { x: myHead.x - 1, y: myHead.y, safe: true },
    right: { x: myHead.x + 1, y: myHead.y, safe: true }
  };

  // Avoid moving backwards
  if (myNeck.x < myHead.x) possibleMoves.left.safe = false;
  else if (myNeck.x > myHead.x) possibleMoves.right.safe = false;
  else if (myNeck.y < myHead.y) possibleMoves.down.safe = false;
  else if (myNeck.y > myHead.y) possibleMoves.up.safe = false;

  // Avoid out-of-bounds
  if (possibleMoves.up.y >= gameState.board.height) possibleMoves.up.safe = false;
  if (possibleMoves.down.y < 0) possibleMoves.down.safe = false;
  if (possibleMoves.left.x < 0) possibleMoves.left.safe = false;
  if (possibleMoves.right.x >= gameState.board.width) possibleMoves.right.safe = false;

  // Avoid own body
  gameState.you.body.forEach((part) => {
    Object.entries(possibleMoves).forEach(([dir, move]) => {
      if (move.x === part.x && move.y === part.y) move.safe = false;
    });
  });

  // Avoid all snakes
  gameState.board.snakes.forEach((snake) => {
    snake.body.forEach((part) => {
      Object.entries(possibleMoves).forEach(([dir, move]) => {
        if (move.x === part.x && move.y === part.y) move.safe = false;
      });
    });
  });

  // Tail consideration
  gameState.board.snakes.forEach((snake) => {
    const isMe = snake.id === gameState.you.id;
    snake.body.forEach((part, idx, arr) => {
      const isTail = idx === arr.length - 1;
      Object.entries(possibleMoves).forEach(([dir, move]) => {
        const same = move.x === part.x && move.y === part.y;
        if (!isMe && isTail) {
          const head = snake.body[0];
          const willEat = gameState.board.food.some(
            (f) => (Math.abs(f.x - head.x) === 1 && f.y === head.y) || (Math.abs(f.y - head.y) === 1 && f.x === head.x)
          );
          if (willEat && same) move.safe = false;
          return;
        }
        if (same) move.safe = false;
      });
    });
  });

  // Head-to-head
  gameState.board.snakes.forEach((snake) => {
    if (snake.id === gameState.you.id) return;
    const otherHead = snake.body[0];
    const otherLength = snake.body.length;
    const myLength = gameState.you.body.length;
    Object.entries(possibleMoves).forEach(([dir, move]) => {
      const collisions = [
        { x: otherHead.x + 1, y: otherHead.y },
        { x: otherHead.x - 1, y: otherHead.y },
        { x: otherHead.x, y: otherHead.y + 1 },
        { x: otherHead.x, y: otherHead.y - 1 }
      ];
      collisions.forEach((cell) => {
        if (move.x === cell.x && move.y === cell.y && myLength <= otherLength) {
          move.safe = false;
        }
      });
    });
  });
  //Iteration of Task 3 and 4, we don't need to check the tail bodypart of each snake
  // gameState.board.snakes.forEach((snake) => {
  //   const isMe = snake.id === gameState.you.id;

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
  //   snake.body.forEach((snakePart, idx, arr) => {
  //     const isTail = idx === arr.length - 1;

  //     Object.entries(possibleMoves).forEach(([direction, value]) => {
  //       const isSamePosition = value.x === snakePart.x && value.y === snakePart.y;

  //       if (!isMe && isTail) {
  //         // Check if this snake is likely to eat (tail won't move)
  //         const snakeHead = snake.body[0];

  //         const willEatFood = gameState.board.food.some(food => 
  //           (Math.abs(food.x - snakeHead.x) === 1 && food.y === snakeHead.y) ||
  //           (Math.abs(food.y - snakeHead.y) === 1 && food.x === snakeHead.x)
  //         );
  // Get all safe moves
  const safeMoves = Object.keys(possibleMoves).filter(
    (key) => possibleMoves[key].safe
  );
  // if (willEatFood && isSamePosition) {
  //   value.safe = false;
  // }
  if (safeMoves.length === 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: 'down' };
  }
  // return; // Continue to next body part
  //       }
  // Prepare targets for A* pathfinding
  const targets = [];
  //    // All other body parts (including own) are unsafe
  //    if (isSamePosition) {
  //     value.safe = false;
  //   }
  // });
  // Add food as targets

  // Add food as targets with priority based on health
  gameState.board.food.forEach(food => {
    // Calculate flood fill area for each potential move to food
    const foodArea = floodFill(gameState.board, food);
    targets.push({
      x: food.x,
      y: food.y,
      food: true,
      priority: gameState.you.health < 50 ? 1 : 2,  // Higher priority when health is low
      area: foodArea  // Add flood fill area for path evaluation
    });
  });

// // Check for potential head-to-head collisions with other snakes
// gameState.board.snakes.forEach((snake) => {
//   // Skip if it's our own snake
//   if (snake.id === gameState.you.id) {
//     return;
  // Add smaller snakes as targets
  // gameState.board.snakes.forEach(snake => {
  //   if (snake.id !== gameState.you.id && snake.body.length < gameState.you.body.length) {
  //     targets.push({
  //       x: snake.body[0].x,
  //       y: snake.body[0].y,
  //       snake: snake
  //     });
  //   }
  // });
//  // Get the other snake's head
//  const otherHead = snake.body[0];
//  const otherLength = snake.body.length;
//  const myLength = gameState.you.body.length;


  // Add smaller snakes as targets when health is high
  if (gameState.you.health >= 50) {
    gameState.board.snakes.forEach(snake => {
      if (snake.id !== gameState.you.id && snake.body.length < myLength) {
        const snakeArea = floodFill(gameState.board, snake.body[0]);
        targets.push({
          x: snake.body[0].x,
          y: snake.body[0].y,
          snake: snake,
          priority: 1,  // Highest priority for hunting when health is good
          area: snakeArea  // Add flood fill area for path evaluation
        });
      }
    });
  }

  // Find best path using A*
  const bestPath = pathfinder.findBestPathToTargets(myHead, targets, gameState);

   // Check each possible move for potential head-to-head collision
//    Object.entries(possibleMoves).forEach(([direction, value]) => {
//     // Calculate potential head-to-head collision cells
//     const potentialCollisions = [
//       { x: otherHead.x + 1, y: otherHead.y }, // right
//       { x: otherHead.x - 1, y: otherHead.y }, // left
//       { x: otherHead.x, y: otherHead.y + 1 }, // up
//       { x: otherHead.x, y: otherHead.y - 1 } // down
//     ];

//     // Check if our move would result in head-to-head collision
//     potentialCollisions.forEach((cell) => {
//       if (value.x === cell.x && value.y === cell.y) {
//         // Mark move as unsafe if our snake is shorter or equal in length
//         if (myLength <= otherLength) {
//           value.safe = false;
//           console.log(
//             `Avoiding head-to-head with snake ${snake.id} - they are longer or equal in length`
//           );
//         }
//       }
//     });
//   });
// });
  if (bestPath && bestPath.length > 0) {
    // Get the next move from the path
    const nextPosition = bestPath[0];
    const moveDirection = getMoveDirection(myHead, nextPosition);
    
    // Verify the move is still safe and leads to a good area
    if (safeMoves.includes(moveDirection)) {
//       console.log(`MOVE ${gameState.turn}: Following A* path to target`);
//       return { move: moveDirection };
//     }
//   }
//  // Are there any safe moves left?
// //  const safeMoves = Object.keys(possibleMoves).filter(
// //   (key) => possibleMoves[key].safe
// // );
// // if (safeMoves.length == 0) {
// //   console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
// //   return { move: 'down' };
// // }
//   // Fallback to random safe move if no good path found
//   const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
//   console.log(`MOVE ${gameState.turn}: No good path found, moving randomly`);
//   return { move: nextMove };
// }
const nextArea = floodFill(gameState.board, nextPosition);
// Only take the path if it leads to a reasonable area
if (nextArea > 3) {  // Minimum area threshold
  console.log(`MOVE ${gameState.turn}: Following A* path to target`);
  return { move: moveDirection };
}
}
}

  // If no good path found, choose the safe move with the largest flood fill area
  let bestMove = safeMoves[0];
  let bestArea = 0;

  // Choose a random move from the safe moves
  //   const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
  for (const move of safeMoves) {
    const nextPos = possibleMoves[move];
    const area = floodFill(gameState.board, nextPos);
    if (area > bestArea) {
      bestArea = area;
      bestMove = move;
    }
  }

  // Move toward food (Manhattan distance)
  let nextMove;
  if (!gameState.board.food.length) {
    nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
  } else {
    const foods = gameState.board.food;
    foods.forEach((food) => {
      food.distanceX = Math.abs(myHead.x - food.x);
      const xDir = myHead.x - food.x < 0 ? 'right' : 'left';
      food.distanceY = Math.abs(myHead.y - food.y);
      const yDir = myHead.y - food.y < 0 ? 'up' : 'down';
      if (food.distanceX < food.distanceY) {
        food.primaryDirection = food.distanceX === 0 ? yDir : xDir;
        food.secondaryDirection = food.distanceX === 0 ? 'none' : yDir;
      } else {
        food.primaryDirection = food.distanceY === 0 ? xDir : yDir;
        food.secondaryDirection = food.distanceY === 0 ? 'none' : xDir;
      }
    });
    foods.sort((a, b) => a.distanceX + a.distanceY - (b.distanceX + b.distanceY));
    const closest = foods.find((f) => safeMoves.includes(f.primaryDirection) || safeMoves.includes(f.secondaryDirection));
    nextMove = closest
      ? safeMoves.includes(closest.primaryDirection)
        ? closest.primaryDirection
        : closest.secondaryDirection
      : safeMoves[Math.floor(Math.random() * safeMoves.length)];
  }

  return { move: nextMove };
  // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
  // food = gameState.board.food;

  //Task 8, select next move using Manhattan distance
  // let nextMove;
  // if (!gameState.board.food.length) {
  //   nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
  //   console.log('random next move');
  // } else {
  //   const foods = gameState.board.food;
  //   foods.forEach((food) => {
  //     food.distanceX = Math.abs(myHead.x - food.x);
  //     const xDirection = myHead.x - food.x < 0 ? 'right' : 'left';
  //     food.distanceY = Math.abs(myHead.y - food.y);
  //     const yDirection = myHead.y - food.y < 0 ? 'up' : 'down';
  //     if (food.distanceX < food.distanceY) {
  //       if (food.distanceX === 0) {
  //         food.primaryDirection = yDirection;
  //         food.secondaryDirection = 'none';
  //       } else {
  //         food.primaryDirection = xDirection;
  //         food.secondaryDirection = yDirection;
  //       }
  //     } else {
  //       if (food.distanceY === 0) {
  //         food.primaryDirection = xDirection;
  //         food.secondaryDirection = 'none';
  //       } else {
  //         food.primaryDirection = yDirection;
  //         food.secondaryDirection = xDirection;
  //       }
  //     }
  //   });
  //   //We sort the foods by the distance to our snake's head
  //   foods.sort(
  //     (a, b) => a.distanceX + a.distanceY - (b.distanceX + b.distanceY)
  //   );
  //   //The closest food is the one we can move towards, not the one that is physically closest to us
  //   const closestFood = foods.find(
  //     (food) =>
  //       safeMoves.includes(food.primaryDirection) ||
  //       safeMoves.includes(food.secondaryDirection)
  //   );
  //   if (closestFood) {
  //     nextMove = safeMoves.includes(closestFood.primaryDirection)
  //       ? closestFood.primaryDirection
  //       : closestFood.secondaryDirection;
  //     console.log(safeMoves, myHead, closestFood);
  //   } else {
  //     //No foods in the direction that is safe to move to, we move randomly
  //     nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
  //   }
  // }
  // console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  // return { move: nextMove };
  console.log(`MOVE ${gameState.turn}: No good path found, choosing safest move`);
  return { move: bestMove };
}

/**

 * Flood Fill Algorithm for Area Calculation
 * 
 * This function calculates the safe area around a given position on any board size.
 * It's used to:
 * 1. Evaluate path safety on different map sizes
 * 2. Avoid getting trapped in small areas
 * 3. Make decisions based on available space
 * 
 * The algorithm works by:
 * - Starting from a given position
 * - Exploring all reachable cells in the current board dimensions
 * - Counting cells that aren't blocked by snake bodies
 * - Returning the total safe area size
 * 
 * @param {Object} board - The game board with width and height
 * @param {Object} start - Starting position {x, y}
 * @returns {number} Size of the safe area

 * Determines the move direction between two positions
 * @param {Object} current - Current position {x, y}
 * @param {Object} next - Next position {x, y}
 * @returns {string} Direction to move ('up', 'down', 'left', or 'right')
 */
function getMoveDirection(current, next) {
  if (next.x > current.x) return 'right';
  if (next.x < current.x) return 'left';
  if (next.y > current.y) return 'up';
  if (next.y < current.y) return 'down';
  return null;
}

/**
 * Calculates accessible area from a starting point using Flood Fill.
 * @param {Object} board - Game board object with dimensions and snake positions.
 * @param {Object} start - Starting coordinate with {x, y}.
 * @returns {number} The accessible space area.
 */
function floodFill(board, start) {
  // Get board dimensions - works with any map size
  const width = board.width;
  const height = board.height;
  const visited = new Set();
  const stack = [start];

  function key(x, y) {
    return `${x},${y}`;
  }

  function isValid(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    if (visited.has(key(x, y))) return false;
    for (const snake of board.snakes) {
      for (const part of snake.body) {
        if (part.x === x && part.y === y) return false;
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


