const { AStar } = require('./pathfinding');

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
  const myLength = gameState.you.body.length;

  // Initialize A* pathfinder with the game board
  const pathfinder = new AStar(gameState.board);

  // Get all possible moves
  let possibleMoves = {
    up: { x: myHead.x, y: myHead.y + 1, safe: true },
    down: { x: myHead.x, y: myHead.y - 1, safe: true },
    left: { x: myHead.x - 1, y: myHead.y, safe: true },
    right: { x: myHead.x + 1, y: myHead.y, safe: true }
  };

  // Prevent moving back into neck
  if (myNeck.x < myHead.x) {
    possibleMoves.left.safe = false;
  } else if (myNeck.x > myHead.x) {
    possibleMoves.right.safe = false;
  } else if (myNeck.y < myHead.y) {
    possibleMoves.down.safe = false;
  } else if (myNeck.y > myHead.y) {
    possibleMoves.up.safe = false;
  }
  //   TODO: Step 1 - Prevent your Battlesnake from moving out of bounds
  // Task 1: if snake is at the edge of the board it tags the moves as unsafe

  // Mark moves that would hit walls as unsafe
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
  // gameState.you.body.forEach((snakePart) => {
  //   Object.entries(possibleMoves).forEach(([direction, value]) => {
  //     if (value.x === snakePart.x && value.y === snakePart.y) {
  //       value.safe = false;
  //     }
  //   });
  // });
  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  // Mark moves that would hit snake bodies as unsafe
  gameState.board.snakes.forEach((snake) => {
    const isMe = snake.id === gameState.you.id;
    const otherLength = snake.body.length;

    snake.body.forEach((snakePart, idx, arr) => {
      const isTail = idx === arr.length - 1;
      const isHead = idx === 0;

      Object.entries(possibleMoves).forEach(([direction, value]) => {
        const isSamePosition = value.x === snakePart.x && value.y === snakePart.y;

        // Skip tail if snake is about to eat (tail will move)
        if (!isMe && isTail) {
          const snakeHead = snake.body[0];
          const willEatFood = gameState.board.food.some(food => 
            (Math.abs(food.x - snakeHead.x) === 1 && food.y === snakeHead.y) ||
            (Math.abs(food.y - snakeHead.y) === 1 && food.x === snakeHead.x)
          );
          if (willEatFood) return;
        }

        // Mark body parts as unsafe
        if (isSamePosition) {
          value.safe = false;
        }

        // Check for head-to-head collisions
        if (!isMe && isHead) {
          const potentialCollisions = [
            { x: snakePart.x + 1, y: snakePart.y }, // right
            { x: snakePart.x - 1, y: snakePart.y }, // left
            { x: snakePart.x, y: snakePart.y + 1 }, // up
            { x: snakePart.x, y: snakePart.y - 1 }  // down
          ];

          potentialCollisions.forEach((cell) => {
            if (value.x === cell.x && value.y === cell.y) {
              // Only avoid if we're shorter or equal in length
              if (myLength <= otherLength) {
                value.safe = false;
                console.log(`Avoiding head-to-head with snake ${snake.id} - they are longer or equal in length`);
              }
            }
          });
        }
      });
    });
  });
  //Iteration of Task 3 and 4, we don't need to check the tail bodypart of each snake
  // gameState.board.snakes.forEach((snake) => {
  //   const isMe = snake.id === gameState.you.id;

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

exports.info = info;
exports.start = start;
exports.move = move;
exports.end = end;
exports.floodFill = floodFill;


