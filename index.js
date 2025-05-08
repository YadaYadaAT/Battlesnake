const { runServer } = require('./server');
const { exec } = require('child_process');

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
      author: 'Sofia',
      color: '#FF0000',
      head: 'smile',
      tail: 'curled'
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
  // gameState.you.body.forEach((snakePart) => {
  //     Object.entries(possibleMoves).forEach(([direction, value]) => {
  //         if (value.x === snakePart.x && value.y === snakePart.y) {
  //             value.safe = false;
  //         }
  //     });
  // });

  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  // gameState.board.snakes.forEach((snake) => {
  //     snake.body.forEach((snakePart) => {
  //         Object.entries(possibleMoves).forEach(([direction, value]) => {
  //             if (value.x === snakePart.x && value.y === snakePart.y) {
  //                 value.safe = false;
  //             }
  //         });
  //     });
  // });

  //Iteration of Task 3 and 4, we don't need to check the tail bodypart of each snake
  gameState.board.snakes.forEach((snake) => {
    snake.body.forEach((snakePart, idx, arr) => {
      Object.entries(possibleMoves).forEach(([direction, value]) => {
        if (idx === arr.length - 1) return;

        if (value.x === snakePart.x && value.y === snakePart.y) {
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

let serverPromises = [];
for (let i = 0; i < Number(process.argv[2]); i++) {
  serverPromises.push(
    runServer({ info: () => info(i), start: start, move: move, end: end }, i)
  );
}
Promise.all(serverPromises).then((ports, snakeId) => {
  const args = ports
    .map(
      (port, idx) =>
        `--name ${info(snakeId).author} --url http://localhost:${port}`
    )
    .join(' ');
  exec(
    `${process.cwd()}/battlesnake/battlesnake.exe  play -W 11 -H 11 ${args} -g standard --browser -d 100`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );
});
