// Welcome to
// __________         __    __  .__                               __
// \______   \_____ _/  |__/  |_|  |   ____   ______ ____ _____  |  | __ ____
//  |    |  _/\__  \\   __\   __\  | _/ __ \ /  ___//    \\__  \ |  |/ // __ \
//  |    |   \ / __ \|  |  |  | |  |_\  ___/ \___ \|   |  \/ __ \|    <\  ___/
//  |________/(______/__|  |__| |____/\_____>______>___|__(______/__|__\\_____>
//
// This file can be a nice home for your Battlesnake logic and helper functions.
//
// To get you started we've included code to prevent your Battlesnake from moving backwards.
// For more info see docs.battlesnake.com

import runServer from "./server.js";

// info is called when you create your Battlesnake on play.battlesnake.com
// and controls your Battlesnake's appearance
// TIP: If you open your Battlesnake URL in a browser you should see this data
function info() {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "", // TODO: Your Battlesnake Username
    color: "#888888", // TODO: Choose color
    head: "default", // TODO: Choose head
    tail: "default", // TODO: Choose tail
  };
}

// start is called when your Battlesnake begins a game
function start(gameState) {
  console.log("GAME START");
}

// end is called when your Battlesnake finishes a game
function end(gameState) {
  console.log("GAME OVER\n");
}

// move is called on every turn and returns your next move
// Valid moves are "up", "down", "left", or "right"
// See https://docs.battlesnake.com/api/example-move for available data
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
  // Task 3 - Avoiding collision with itself

  gameState.you.body.forEach((snakePart) => {
    Object.entries(possibleMoves).forEach(([direction, value]) => {
      if (value.x === snakePart.x && value.y === snakePart.y) {
        value.safe = false;
      }
    });
  });
  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  // opponents = gameState.board.snakes;

  gameState.board.snakes.forEach((snake) => { 

    snake.body.forEach((snakePart) => { 

        Object.entries(possibleMoves).forEach(([direction, value]) => { 

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

runServer({
  info: info,
  start: start,
  move: move,
  end: end,
});
