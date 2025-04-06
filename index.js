import runServer from './server.js';
import chalk from 'chalk';

// info is called when you create your Battlesnake on play.battlesnake.com
// and controls your Battlesnake's appearance
// TIP: If you open your Battlesnake URL in a browser you should see this data
function info() {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "",       // TODO: Your Battlesnake Username
    color: "#888888", // TODO: Choose color
    head: "default",  // TODO: Choose head
    tail: "default",  // TODO: Choose tail
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

  let isMoveSafe = {
    up: true,
    down: true,
    left: true,
    right: true
  };

  // We've included code to prevent your Battlesnake from moving backwards
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  if (myNeck.x < myHead.x) {        // Neck is left of head, don't move left
    isMoveSafe.left = false;

  } else if (myNeck.x > myHead.x) { // Neck is right of head, don't move right
    isMoveSafe.right = false;

  } else if (myNeck.y < myHead.y) { // Neck is below head, don't move down
    isMoveSafe.down = false;

  } else if (myNeck.y > myHead.y) { // Neck is above head, don't move up
    isMoveSafe.up = false;
  }

  // TODO: Step 1 - Prevent your Battlesnake from moving out of bounds
  // boardWidth = gameState.board.width;
  // boardHeight = gameState.board.height;

  // TODO: Step 2 - Prevent your Battlesnake from colliding with itself
  // myBody = gameState.you.body;

  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  // opponents = gameState.board.snakes;

  // Are there any safe moves left?
  const safeMoves = Object.keys(isMoveSafe).filter(key => isMoveSafe[key]);
  if (safeMoves.length == 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
  }

  // Choose a random move from the safe moves
  const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];

  // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
  // food = gameState.board.food;

  console.log(`MOVE ${gameState.turn}: ${nextMove}`)
//  console.log(gameState);
  printBoard(gameState.board)
  return { move: nextMove };
}

function printBoard(board){
  for(let row = 0; row<board.height; row++){
    let lineToPrint = "";
    for(let column = 0; column<board.width; column++){
      let characterToPrint = " . ";//Empty
      if(hasObjectInPosition(board.food, column, row))
        characterToPrint = "🍔";//Food
      else if(hasObjectInPosition(board.hazards, column, row))
        characterToPrint = "⚠️";//Hazard
      board.snakes.forEach(snake => {
        const snakeChalk = chalk.bgHex(snake.customizations.color)
        if(hasObjectInPosition(snake.body, column, row))
          characterToPrint = snakeChalk("🐍");//Snake
      });
      lineToPrint += characterToPrint;
    }
    console.log(chalk.bgBlueBright(lineToPrint));
  }
}

function hasObjectInPosition(arr, x, y){
  return !!arr.find(ob => ob.x===x && ob.y===y);
}

runServer({
  info: info,
  start: start,
  move: move,
  end: end
});