const { runServer } = require('./server');
const { exec } = require('child_process');

function info(idx = 0) { 
  console.log("INFO"); 

  const snakeInfos = [ 
      {
        apiversion: "1", 
        author: "Anastasia", // TODO: Your Battlesnake Username 
        color: "#3E338F", // TODO: Choose color 
        head: "smile", // TODO: Choose head 
        tail: "default", // TODO: Choose tail 
      }, 

      { 
        apiversion: "1", 
        author: "Sofia", // TODO: Your Battlesnake Username 
        color: "#FF0000", // TODO: Choose color 
        head: "smile", // TODO: Choose head 
        tail: "curled", // TODO: Choose tail 
      }, 
  ]; 

  return snakeInfos[idx]; 
} 
// start is called when your Battlesnake begins a game
function start(gameState) {
  console.log("GAME START");
}

// end is called when your Battlesnake finishes a game
function end(gameState) {
  console.log("GAME OVER\n");
}

function move(gameState) {
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  let possibleMoves = {
      up: { x: myHead.x, y: myHead.y + 1, safe: true },
      down: { x: myHead.x, y: myHead.y - 1, safe: true },
      left: { x: myHead.x - 1, y: myHead.y, safe: true },
      right: { x: myHead.x + 1, y: myHead.y, safe: true },
  };

  // We've included code to prevent your Battlesnake from moving backwards

  if (myNeck.x < myHead.x) {
      // Neck is left of head, don't move left
      possibleMoves.left.safe = false;
  } else if (myNeck.x > myHead.x) {
      // Neck is right of head, don't move right
      possibleMoves.right.safe = false;
  } else if (myNeck.y < myHead.y) {
      // Neck is below head, don't move down
      possibleMoves.down.safe = false;
  } else if (myNeck.y > myHead.y) {
      // Neck is above head, don't move up
      possibleMoves.up.safe = false;
  }

  // TODO: Step 1 - Prevent your Battlesnake from moving out of bounds
  // boardWidth = gameState.board.width;
  // boardHeight = gameState.board.height;
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
  // myBody = gameState.you.body;

  //Task 3 - Avoiding collision with itself
  // gameState.you.body.forEach((snakePart) => {
  //     Object.entries(possibleMoves).forEach(([direction, value]) => {
  //         if (value.x === snakePart.x && value.y === snakePart.y) {
  //             value.safe = false;
  //         }
  //     });
  // });

  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  // opponents = gameState.board.snakes;

  //Task 4 - Avoiding collision with other sneaks, Task 3 is a subset of this task as gameState.board.snakes includes gameState.you
  // gameState.board.snakes.forEach((snake) => {
  //     snake.body.forEach((snakePart) => {
  //         Object.entries(possibleMoves).forEach(([direction, value]) => {
  //             if (value.x === snakePart.x && value.y === snakePart.y) {
  //                 value.safe = false;
  //             }
  //         });
  //     });
  // });

  //Task 17 - Iteration of Task 3 and 4, we don't need to check the tail bodypart of each snake
  gameState.board.snakes.forEach((snake) => {
      snake.body.forEach((snakePart, idx, arr) => {
          Object.entries(possibleMoves).forEach(([direction, value]) => {
              if(idx === arr.length-1)
                  return;

              if (value.x === snakePart.x && value.y === snakePart.y) {
                  value.safe = false;
              }
          });
      });
  });

  // Are there any safe moves left?
    const safeMoves = Object.keys(possibleMoves).filter((key) => possibleMoves[key].safe);
    if (safeMoves.length == 0) {
        console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
        return { move: "down" };
    }

  // Choose a random move from the safe moves
  const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];

  // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
  // food = gameState.board.food;

  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}

let serverPromises = [];
for (let i = 0; i < Number(process.argv[2]); i++) {
    serverPromises.push(runServer({ info: () => info(i), start: start, move: move, end: end }, i));
}
Promise.all(serverPromises).then((ports, snakeId) => {
    const args = ports.map((port, idx) => `--name ${info(snakeId).author} --url http://localhost:${port}`).join(" ");
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