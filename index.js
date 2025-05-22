const { runServer } = require('./server');
const { exec } = require('child_process');
const { platform } = require('os');
const path = require('path');
const fs = require('fs');
const handlers = require('./handlers');


const numSnakes = Number(process.argv[2]) || 1;
let serverPromises = [];

for (let i = 0; i < numSnakes; i++) {
  serverPromises.push(
    runServer(
      {
        info: () => handlers.info(i),
        start: handlers.start,
        move: handlers.move,
        end: handlers.end
      },
      i
    )
  );
}

Promise.all(serverPromises).then((ports) => {
  const args = ports
    .map(
      (port, idx) =>
        `--name "${handlers.info(idx).author}" --url http://localhost:${port}`
    )
    .join(' ');

  const isWindows = platform() === 'win32';

  const binaryPath = isWindows
    ? path.join(process.cwd(), 'battlesnake', 'battlesnake.exe')
    : path.join(process.cwd(), 'battlesnake', 'battlesnake-linux');

  if (!fs.existsSync(binaryPath)) {
    console.error(`❌ Battlesnake binary not found at: ${binaryPath}`);
    process.exit(1);
  }

  // Make sure it's executable in Linux
  if (!isWindows) {
    fs.chmodSync(binaryPath, '755');
  }

  const playCommand = `${binaryPath} play -W 11 -H 11 ${args} -g standard --browser -d 100`;

  console.log(`🐍 Starting Battlesnake with: ${playCommand}`);
  exec(playCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Execution error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ stderr: ${stderr}`);
    }
    if (stdout) {
      console.log(`✅ stdout:\n${stdout}`);
    }
  });
});

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
