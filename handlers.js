/**
 * Returns snake customization info based on index.
 * @param {number} [idx=0] - Index of the snake in the list.
 * @returns {Object} Snake info with appearance configuration.
 */
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

  const safeMoves = Object.keys(possibleMoves).filter((key) => possibleMoves[key].safe);
  if (safeMoves.length === 0) return { move: 'down' };

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
}

/**
 * Calculates accessible area from a starting point using Flood Fill.
 * @param {Object} board - Game board object with dimensions and snake positions.
 * @param {Object} start - Starting coordinate with {x, y}.
 * @returns {number} The accessible space area.
 */
function floodFill(board, start) {
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

exports.info = info;
exports.start = start;
exports.move = move;
exports.end = end;
exports.floodFill = floodFill;


