const { AStar } = require('./pathfinding');

/**
 * Returns snake customization info based on index.
 * @param {number} [idx=0] - Index of the snake in the list.
 * @returns {Object} Snake info with appearance configuration.
 */
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
 * Simulates a move and returns the resulting game state
 * @param {Object} gameState - Current game state
 * @param {string} move - Direction to move ('up', 'down', 'left', 'right')
 * @returns {Object} Simulated game state after the move
 */
function simulateMove(gameState, move) {
  // Create a deep copy of the game state
  const newState = JSON.parse(JSON.stringify(gameState));
  const mySnake = newState.you;
  const myHead = mySnake.body[0];

  // Calculate new head position
  let newHead;
  switch (move) {
    case 'up':
      newHead = { x: myHead.x, y: myHead.y + 1 };
      break;
    case 'down':
      newHead = { x: myHead.x, y: myHead.y - 1 };
      break;
    case 'left':
      newHead = { x: myHead.x - 1, y: myHead.y };
      break;
    case 'right':
      newHead = { x: myHead.x + 1, y: myHead.y };
      break;
  }

  // Update snake body
  mySnake.body.unshift(newHead);

  // Check if food was eaten
  const foodEaten = newState.board.food.some(
    (food) => food.x === newHead.x && food.y === newHead.y
  );

  if (foodEaten) {
    // Remove eaten food
    newState.board.food = newState.board.food.filter(
      (food) => !(food.x === newHead.x && food.y === newHead.y)
    );
    // Reset health and don't remove tail
    mySnake.health = 100;
  } else {
    // Remove tail if no food eaten
    mySnake.body.pop();
    // Decrease health
    mySnake.health -= 1;
  }

  // Update turn number
  newState.turn += 1;

  return newState;
}

/**
 * Evaluates a game state and returns a score
 * @param {Object} gameState - Game state to evaluate
 * @returns {number} Score for the game state (higher is better)
 */
function evaluateGameState(gameState) {
  const mySnake = gameState.you;
  const myHead = mySnake.body[0];
  let score = 0;

  // Factor 1: Health status (0-100 points)
  score += mySnake.health;

  // Factor 2: Available space (0-100 points)
  const availableSpace = floodFill(gameState.board, myHead);
  score += Math.min(availableSpace * 2, 100); // Cap at 100 points

  // Factor 3: Distance to food (0-50 points)
  if (gameState.board.food.length > 0) {
    const closestFood = gameState.board.food.reduce(
      (closest, food) => {
        const distance =
          Math.abs(food.x - myHead.x) + Math.abs(food.y - myHead.y);
        return distance < closest.distance ? { food, distance } : closest;
      },
      { distance: Infinity, food: null }
    );

    if (closestFood.food) {
      score += Math.max(50 - closestFood.distance * 5, 0);
    }
  }

  // Factor 4: Hunting opportunities (0-50 points)
  const nearbySmallerSnakes = findNearbySmallerSnakes(gameState, myHead);
  score += Math.min(nearbySmallerSnakes.length * 25, 50);

  // Factor 5: Safety from larger snakes (-50 to 0 points)
  gameState.board.snakes.forEach((snake) => {
    if (snake.id !== mySnake.id && snake.body.length > mySnake.body.length) {
      const distance =
        Math.abs(snake.body[0].x - myHead.x) +
        Math.abs(snake.body[0].y - myHead.y);
      if (distance <= 2) {
        score -= 25; // Penalize being close to larger snakes
      }
    }
  });

  return score;
}

/**
 * Looks ahead multiple moves to find the best move
 * @param {Object} gameState - Current game state
 * @param {number} depth - How many moves to look ahead
 * @returns {string} Best move to make
 */
function lookAhead(gameState, depth = 2) {
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];
  const board = gameState.board;

  const possibleMoves = calculatePossibleMoves(myHead, board);

  filterBackwardsMove(possibleMoves, myHead, myNeck);

  filterOutOfBoundsMoves(possibleMoves, gameState, board.width, board.height, myHead);
  filterCollisions(possibleMoves, gameState);
  filterTailCollision(possibleMoves, gameState);
  filterHeadToHeadCollision(possibleMoves, gameState);

  const safeMoves = Object.entries(possibleMoves)
    .filter(([_, move]) => move.safe)
    .map(([dir]) => dir);

  if (safeMoves.length === 0) return null;

  let bestScore = -Infinity;
  let bestMove = null;

  for (const move of safeMoves) {
    const newState = simulateMove(gameState, move);

    if (depth === 1) {
      const score = evaluateGameState(newState);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      const nextMove = lookAhead(newState, depth - 1);
      if (nextMove) {
        const nextState = simulateMove(newState, nextMove);
        const score = evaluateGameState(nextState);
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }
  }

  return bestMove;
}

/**
 * Determines the next move based on the current game state.
 * @param {Object} gameState - The current game state provided by the Battlesnake engine.
 * @returns {{move: string}} The direction to move.
 */
class GameStateEvaluator {
  constructor(gameState) {
    this.gameState = gameState;
    this.board = gameState.board;
    this.mySnake = gameState.you;
    this.boardSize = this.board.width * this.board.height;

    // Initialize evaluation weights
    this.weights = {
      health: 0.25, // Health and survival importance
      foodAccess: 0.2, // Food accessibility
      spaceControl: 0.2, // Available space and territory
      threatLevel: 0.15, // Threat assessment
      position: 0.1, // Position evaluation
      pathSafety: 0.1 // Path safety evaluation
    };

    // Initialize thresholds
    this.thresholds = {
      criticalHealth: 30, // Health level considered critical
      huntingHealth: 70, // Health level for hunting
      minSafeArea: Math.max(3, Math.floor(this.boardSize * 0.1)), // Minimum safe area
      immediateThreat: 2, // Distance for immediate threat
      potentialThreat: 4 // Distance for potential threat
    };
  }

  /**
   * Evaluates the overall game state
   * @returns {Object} Complete evaluation with scores and recommendations
   */
  evaluateGameState() {
    const evaluation = {
      overallScore: 0,
      factors: {},
      recommendations: [],
      threats: [],
      opportunities: []
    };

    // Evaluate each factor
    evaluation.factors.health = this.evaluateHealth();
    evaluation.factors.foodAccess = this.evaluateFoodAccess();
    evaluation.factors.spaceControl = this.evaluateSpaceControl();
    evaluation.factors.threatLevel = this.evaluateThreats();
    evaluation.factors.position = this.evaluatePosition();
    evaluation.factors.pathSafety = this.evaluatePathSafety();

    // Calculate overall score
    evaluation.overallScore = Object.entries(evaluation.factors).reduce(
      (score, [factor, value]) => score + value * this.weights[factor],
      0
    );

    // Generate recommendations
    this.generateRecommendations(evaluation);

    return evaluation;
  }

  /**
 * Counts the number of safe adjacent positions (escape routes) from a given position
 * @param {Object} pos - Current position {x, y}
 * @returns {number} Number of safe escape routes (0-4)
 */
countEscapeRoutes(pos) {
  const directions = ['up', 'down', 'left', 'right'];
  let safeCount = 0;

  for (const direction of directions) {
    const newPos = this.calculateNewPosition(pos, direction);
    if (this.isValidPosition(newPos) && this.isPositionSafe(newPos)) {
      safeCount++;
    }
  }

  return safeCount;
}

/**
 * Checks if a given position is safe (not occupied by snake body or wall)
 * @param {Object} pos - Position to check {x, y}
 * @returns {boolean} true if safe, false otherwise
 */
isPositionSafe(pos) {
  // Check boundaries
  if (!this.isValidPosition(pos)) return false;

  // Check if position collides with any snake body segment
  for (const snake of this.board.snakes) {
    for (const segment of snake.body) {
      if (segment.x === pos.x && segment.y === pos.y) {
        return false;
      }
    }
  }

  return true;
}

  /**
   * Evaluates health status and survival metrics
   * @returns {Object} Health evaluation with score and status
   */
  evaluateHealth() {
    const health = this.mySnake.health;
    const length = this.mySnake.body.length;

    // Calculate base health score
    const healthScore = health / 100;
    const lengthScore = Math.min(1, length / (this.boardSize * 0.3));

    // Determine health status
    let status = 'healthy';
    if (health <= this.thresholds.criticalHealth) {
      status = 'critical';
    } else if (health <= 50) {
      status = 'low';
    }

    // Calculate final score with bonuses/penalties
    let score = healthScore * 0.6 + lengthScore * 0.4;
    if (health > 80) score += 0.1; // Bonus for being well-fed
    if (status === 'critical') score *= 0.8; // Penalty for critical health

    return {
      score: Math.min(1, score),
      status,
      health,
      length,
      isCritical: health <= this.thresholds.criticalHealth,
      canHunt: health >= this.thresholds.huntingHealth
    };
  }

    /**
   * Evaluate path safety and distance to a specific target position
   * @param {Object} target - Target position {x, y}
   * @returns {number} Safety score between 0 and 1 (higher is safer)
   */
  evaluatePathToTarget(target) {
    const myHead = this.mySnake.body[0];

    // Calculate Manhattan distance as base path length
    const distance = Math.abs(target.x - myHead.x) + Math.abs(target.y - myHead.y);

    // Early return 0 if target is out of bounds (optional)
    if (
      target.x < 0 ||
      target.x >= this.board.width ||
      target.y < 0 ||
      target.y >= this.board.height
    ) {
      return 0;
    }

    // Use floodFill to estimate safe area reachable from target
    // (Assuming floodFill(board, pos) returns number of safe tiles)
    const safeAreaFromTarget = floodFill(this.board, target);

    // Compute safety score combining distance and safe area
    // Normalize distance relative to max possible distance on board
    const maxDistance = this.board.width + this.board.height;
    const distanceScore = 1 - distance / maxDistance;

    // Normalize safe area relative to board size
    const areaScore = safeAreaFromTarget / this.boardSize;

    // Weighted combined score (tune weights if needed)
    const pathSafetyScore = distanceScore * 0.6 + areaScore * 0.4;

    // Clamp between 0 and 1
    return Math.min(1, Math.max(0, pathSafetyScore));
  }

  /**
   * Evaluates food accessibility and hunger management
   * @returns {Object} Food access evaluation with score and targets
   */
  evaluateFoodAccess() {
    if (!this.board.food.length) {
      return { score: 0, targets: [], isUrgent: false };
    }

    const myHead = this.mySnake.body[0];
    const targets = this.board.food.map((food) => {
      const distance =
        Math.abs(food.x - myHead.x) + Math.abs(food.y - myHead.y);
      const pathSafety = this.evaluatePathToTarget(food);
      return {
        position: food,
        distance,
        pathSafety,
        score: this.calculateFoodScore(distance, pathSafety)
      };
    });


    // Sort targets by score
    targets.sort((a, b) => b.score - a.score);

    // Calculate overall food access score
    const bestTarget = targets[0];
    const isUrgent = this.mySnake.health <= this.thresholds.criticalHealth;
    const score = bestTarget ? bestTarget.score * (isUrgent ? 1.2 : 1) : 0;

    return {
      score: Math.min(1, score),
      targets,
      isUrgent,
      bestTarget: bestTarget?.position
    };
  }

  /**
   * Evaluates space control and available territory
   * @returns {Object} Space control evaluation with score and areas
   */
  evaluateSpaceControl() {
    const myHead = this.mySnake.body[0];
    const safeArea = floodFill(this.board, myHead);

    // Calculate space metrics
    const spaceScore = safeArea / this.boardSize;
    const centerDistance = this.calculateCenterDistance(myHead);
    const escapeRoutes = this.countEscapeRoutes(myHead);

    // Evaluate territory control
    const territoryScore = this.evaluateTerritoryControl();

    return {
      score: Math.min(
        1,
        spaceScore * 0.5 + territoryScore * 0.3 + (escapeRoutes / 4) * 0.2
      ),
      safeArea,
      centerDistance,
      escapeRoutes,
      isTrapped: safeArea < this.thresholds.minSafeArea,
      territoryScore
    };
  }

  /**
   * Evaluates threats from other snakes
   * @returns {Object} Threat evaluation with score and threats
   */
  evaluateThreats() {
    const myHead = this.mySnake.body[0];
    const myLength = this.mySnake.body.length;
    const threats = [];

    this.board.snakes.forEach((snake) => {
      if (snake.id === this.mySnake.id) return;

      const otherHead = snake.body[0];
      const otherLength = snake.body.length;
      const distance =
        Math.abs(otherHead.x - myHead.x) + Math.abs(otherHead.y - myHead.y);

      const threat = {
        snake: snake,
        distance,
        isImmediate: distance <= this.thresholds.immediateThreat,
        isPotential: distance <= this.thresholds.potentialThreat,
        isDangerous: otherLength >= myLength,
        direction: this.calculateThreatDirection(myHead, otherHead)
      };

      threats.push(threat);
    });

    // Calculate threat score
    const threatScore = threats.reduce((score, threat) => {
      if (threat.isImmediate && threat.isDangerous) return score - 0.3;
      if (threat.isPotential && threat.isDangerous) return score - 0.1;
      return score;
    }, 1);

    return {
      score: Math.max(0, threatScore),
      threats,
      immediateThreats: threats.filter((t) => t.isImmediate),
      potentialThreats: threats.filter((t) => t.isPotential)
    };
  }

  /**
   * Evaluates current position on the board
   * @returns {Object} Position evaluation with score and metrics
   */
  evaluatePosition() {
    const myHead = this.mySnake.body[0];

    // Calculate position metrics
    const wallDistance = this.calculateWallDistance(myHead);
    const centerDistance = this.calculateCenterDistance(myHead);
    const escapeRoutes = this.countEscapeRoutes(myHead);

    // Evaluate position quality
    const positionScore =
      wallDistance * 0.4 +
      (1 - centerDistance) * 0.3 +
      (escapeRoutes / 4) * 0.3;

    return {
      score: Math.min(1, positionScore),
      wallDistance,
      centerDistance,
      escapeRoutes,
      isCornered: escapeRoutes <= 1,
      isCenter: centerDistance < 0.2
    };
  }

  /**
   * Evaluates path safety to a target
   * @param {Object} target - Target position to evaluate
   * @returns {Object} Path safety evaluation
   */
  evaluatePathSafety() {
    const myHead = this.mySnake.body[0];
    const directions = ['up', 'down', 'left', 'right'];
    const pathEvaluations = directions.map((direction) => {
      const newPos = this.calculateNewPosition(myHead, direction);
      if (!this.isValidPosition(newPos)) {
        return { direction, score: 0, safe: false };
      }

      const area = floodFill(this.board, newPos);
      const threats = this.evaluateThreatsAtPosition(newPos);
      const score = this.calculatePathSafetyScore(area, threats);

      return {
        direction,
        score,
        safe: score > 0.5,
        area,
        threats
      };
    });

    return {
      score: Math.max(...pathEvaluations.map((p) => p.score)),
      paths: pathEvaluations,
      safestDirection: pathEvaluations.reduce((best, current) =>
        current.score > best.score ? current : best
      ).direction
    };
  }

  /**
   * Generates recommendations based on evaluation
   * @param {Object} evaluation - Complete game state evaluation
   */
  generateRecommendations(evaluation) {
    const { factors } = evaluation;

    // Health-based recommendations
    if (factors.health.isCritical) {
      evaluation.recommendations.push('Seek food immediately');
    } else if (factors.health.canHunt) {
      evaluation.recommendations.push('Consider hunting smaller snakes');
    }

    // Food-based recommendations
    if (factors.foodAccess.isUrgent) {
      evaluation.recommendations.push('Prioritize closest food');
    } else if (factors.foodAccess.targets.length > 0) {
      evaluation.recommendations.push('Plan path to best food target');
    }

    // Space-based recommendations
    if (factors.spaceControl.isTrapped) {
      evaluation.recommendations.push('Find escape route');
    } else if (factors.spaceControl.territoryScore < 0.3) {
      evaluation.recommendations.push('Expand territory');
    }

    // Threat-based recommendations
    if (factors.threatLevel.immediateThreats.length > 0) {
      evaluation.recommendations.push('Evade immediate threats');
    } else if (factors.threatLevel.potentialThreats.length > 0) {
      evaluation.recommendations.push('Monitor potential threats');
    }

    // Position-based recommendations
    if (factors.position.isCornered) {
      evaluation.recommendations.push('Move away from corner');
    } else if (!factors.position.isCenter && factors.spaceControl.score > 0.7) {
      evaluation.recommendations.push('Consider moving toward center');
    }
  }

  // Helper methods
  calculateNewPosition(head, direction) {
    switch (direction) {
      case 'up':
        return { x: head.x, y: head.y + 1 };
      case 'down':
        return { x: head.x, y: head.y - 1 };
      case 'left':
        return { x: head.x - 1, y: head.y };
      case 'right':
        return { x: head.x + 1, y: head.y };
      default:
        return head;
    }
  }

  isValidPosition(pos) {
    return (
      pos.x >= 0 &&
      pos.x < this.board.width &&
      pos.y >= 0 &&
      pos.y < this.board.height
    );
  }

  calculateWallDistance(pos) {
    const minX = Math.min(pos.x, this.board.width - 1 - pos.x);
    const minY = Math.min(pos.y, this.board.height - 1 - pos.y);
    return Math.min(minX, minY) / Math.max(this.board.width, this.board.height);
  }

  calculateCenterDistance(pos) {
    const centerX = this.board.width / 2;
    const centerY = this.board.height / 2;
    const distance = Math.abs(pos.x - centerX) + Math.abs(pos.y - centerY);
    return distance / (this.board.width + this.board.height);
  }

  calculateThreatDirection(myHead, otherHead) {
    const dx = otherHead.x - myHead.x;
    const dy = otherHead.y - myHead.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'up' : 'down';
  }

  evaluateTerritoryControl() {
    const myHead = this.mySnake.body[0];
    const centerX = this.board.width / 2;
    const centerY = this.board.height / 2;
    const distanceToCenter =
      Math.abs(myHead.x - centerX) + Math.abs(myHead.y - centerY);
    return 1 - distanceToCenter / (this.board.width + this.board.height);
  }

  calculateFoodScore(distance, pathSafety) {
    const distanceScore = 1 - distance / (this.board.width + this.board.height);
    return distanceScore * 0.7 + pathSafety * 0.3;
  }

  evaluateThreatsAtPosition(pos) {
    return this.board.snakes
      .filter((snake) => snake.id !== this.mySnake.id)
      .map((snake) => ({
        snake,
        distance:
          Math.abs(snake.body[0].x - pos.x) + Math.abs(snake.body[0].y - pos.y),
        isDangerous: snake.body.length >= this.mySnake.body.length
      }));
  }

  calculatePathSafetyScore(area, threats) {
    const areaScore = area / this.boardSize;
    const threatScore = threats.reduce((score, threat) => {
      if (
        threat.distance <= this.thresholds.immediateThreat &&
        threat.isDangerous
      ) {
        return score - 0.3;
      }
      if (
        threat.distance <= this.thresholds.potentialThreat &&
        threat.isDangerous
      ) {
        return score - 0.1;
      }
      return score;
    }, 1);
    return Math.max(0, areaScore * 0.6 + threatScore * 0.4);
  }
}

function filterBackwardsMove(possibleMoves, myHead, myNeck) {
  if (myNeck.x < myHead.x) possibleMoves.left.safe = false;
  else if (myNeck.x > myHead.x) possibleMoves.right.safe = false;
  else if (myNeck.y > myHead.y) possibleMoves.down.safe = false;
  else if (myNeck.y < myHead.y) possibleMoves.up.safe = false;
}

function filterOutOfBoundsMoves(possibleMoves, boardWidth, boardHeight, myHead) {
  for (let i = possibleMoves.length - 1; i >= 0; i--) {
    const move = possibleMoves[i];
    const newPos = calculateNewPosition(myHead, move);
    if (
      newPos.x < 0 ||
      newPos.x >= boardWidth ||
      newPos.y < 0 ||
      newPos.y >= boardHeight
    ) {
      possibleMoves.splice(i, 1);
    }
  }
}

function filterCollisions(possibleMoves, gameState) {
  // Collide with own body
  gameState.you.body.forEach((part) => {
    Object.values(possibleMoves).forEach((move) => {
      if (move.x === part.x && move.y === part.y) move.safe = false;
    });
  });

  // Collide with any snake body
  gameState.board.snakes.forEach((snake) => {
    snake.body.forEach((part) => {
      Object.values(possibleMoves).forEach((move) => {
        if (move.x === part.x && move.y === part.y) move.safe = false;
      });
    });
  });
}

function filterTailCollision(possibleMoves, gameState) {
  gameState.board.snakes.forEach((snake) => {
    const isMe = snake.id === gameState.you.id;
    snake.body.forEach((part, idx, arr) => {
      const isTail = idx === arr.length - 1;
      Object.values(possibleMoves).forEach((move) => {
        const same = move.x === part.x && move.y === part.y;
        if (!isMe && isTail) {
          const head = snake.body[0];
          const willEat = gameState.board.food.some(
            (f) =>
              (Math.abs(f.x - head.x) === 1 && f.y === head.y) ||
              (Math.abs(f.y - head.y) === 1 && f.x === head.x)
          );
          if (willEat && same) move.safe = false;
          return;
        }
        if (!isMe && same) move.safe = false;
      });
    });
  });
}

function filterHeadToHeadCollision(possibleMoves, gameState) {
  const myLength = gameState.you.body.length;
  gameState.board.snakes.forEach((snake) => {
    if (snake.id === gameState.you.id) return;
    const otherHead = snake.body[0];
    const otherLength = snake.body.length;

    Object.values(possibleMoves).forEach((move) => {
      const adjacentCells = [
        { x: otherHead.x + 1, y: otherHead.y },
        { x: otherHead.x - 1, y: otherHead.y },
        { x: otherHead.x, y: otherHead.y + 1 },
        { x: otherHead.x, y: otherHead.y - 1 }
      ];
      adjacentCells.forEach((cell) => {
        if (move.x === cell.x && move.y === cell.y && myLength <= otherLength) {
          move.safe = false;
        }
      });
    });
  });
}

function chooseHuntingMove(possibleMoves, targetSnake, gameState) {
  const movesWithScore = Object.entries(possibleMoves)
    .filter(([_, move]) => move.safe)
    .map(([dir, move]) => [
      dir,
      isGoodHuntingMove(move, targetSnake, gameState) ? 1 : 0
    ]);

  if (movesWithScore.length === 0) return null;

  movesWithScore.sort((a, b) => b[1] - a[1]);
  return movesWithScore[0][1] === 1 ? movesWithScore[0][0] : null;
}

function getSafeMoves(possibleMoves) {
  return Object.keys(possibleMoves).filter((key) => possibleMoves[key].safe);
}

function chooseMoveTowardFood(gameState, myHead, safeMoves, possibleMoves) {
  if (!gameState.board.food.length) {
    // No food, just pick random safe move
    return safeMoves[Math.floor(Math.random() * safeMoves.length)];
  }

  // Sort food by Manhattan distance and prefer directions
  const foods = gameState.board.food.map((food) => {
    const distanceX = Math.abs(myHead.x - food.x);
    const distanceY = Math.abs(myHead.y - food.y);
    const xDir = myHead.x < food.x ? 'right' : 'left';
    const yDir = myHead.y < food.y ? 'up' : 'down';

    let primaryDirection, secondaryDirection;
    if (distanceX < distanceY) {
      primaryDirection = distanceX === 0 ? yDir : xDir;
      secondaryDirection = distanceX === 0 ? 'none' : yDir;
    } else {
      primaryDirection = distanceY === 0 ? xDir : yDir;
      secondaryDirection = distanceY === 0 ? 'none' : xDir;
    }

    return {
      ...food,
      distanceX,
      distanceY,
      primaryDirection,
      secondaryDirection
    };
  });

  foods.sort((a, b) => a.distanceX + a.distanceY - (b.distanceX + b.distanceY));

  for (const food of foods) {
    if (safeMoves.includes(food.primaryDirection)) return food.primaryDirection;
    if (safeMoves.includes(food.secondaryDirection))
      return food.secondaryDirection;
  }

  return safeMoves[Math.floor(Math.random() * safeMoves.length)];
}

// Main move function with helper calls
function move(gameState) {
  console.log(`MOVE ${gameState.turn}: Looking ahead for best move`);

  const lookAheadMove = lookAhead(gameState, 2);
  if (lookAheadMove) {
    console.log(`MOVE ${gameState.turn}: Found best move through look-ahead`);
    return { move: lookAheadMove };
  }

  console.log(`MOVE ${gameState.turn}: Falling back to original move logic`);

  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];
  const board = gameState.board;
  const boardWidth = board.width;
  const boardHeight = board.height;

  let possibleMoves = calculatePossibleMoves(myHead, board);

  filterBackwardsMove(possibleMoves, myHead, myNeck);
  filterOutOfBoundsMoves(possibleMoves, boardWidth, boardHeight, myHead);
  filterCollisions(possibleMoves, gameState);
  filterTailCollision(possibleMoves, gameState);
  filterHeadToHeadCollision(possibleMoves, gameState);

  const safeMoves = getSafeMoves(possibleMoves);

  if (safeMoves.length === 0) {
    // No safe moves, fallback: pick any possible move or just 'down' if nothing else
    if (possibleMoves.length > 0) {
      console.log(`MOVE ${gameState.turn}: No safe moves, picking from possible moves`);
      return { move: possibleMoves[0] };
    }
    console.log(`MOVE ${gameState.turn}: No moves at all, moving down as last resort`);
    return { move: 'down' };
  }

  // Hunting smaller snakes logic: pick hunting move only from safeMoves
  const nearbySmallerSnakes = findNearbySmallerSnakes(gameState, myHead);
  if (nearbySmallerSnakes.length > 0) {
    const huntingMove = chooseHuntingMove(
      safeMoves,
      nearbySmallerSnakes[0],
      gameState
    );
    if (huntingMove) {
      console.log(
        `MOVE ${gameState.turn}: Hunting smaller snake! Moving ${huntingMove}`
      );
      return { move: huntingMove };
    }
  }

  // Food logic fallback: pick move toward food only from safeMoves
  const nextMove = chooseMoveTowardFood(
    gameState,
    myHead,
    safeMoves,
    possibleMoves
  );
  console.log(
    `MOVE ${gameState.turn}: Moving towards food or safe move: ${nextMove}`
  );
  return { move: nextMove };
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
    const distance =
      Math.abs(snakeHead.x - myHead.x) + Math.abs(snakeHead.y - myHead.y);

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
  const currentDistance =
    Math.abs(move.x - targetSnake.head.x) +
    Math.abs(move.y - targetSnake.head.y);
  const myHead = gameState.you.body[0];
  const currentDistanceToTarget =
    Math.abs(myHead.x - targetSnake.head.x) +
    Math.abs(myHead.y - targetSnake.head.y);

  // Move is good if it gets us closer to the target
  return currentDistance < currentDistanceToTarget;
}

exports.info = info;
exports.start = start;
exports.move = move;
exports.end = end;
exports.floodFill = floodFill;
exports.GameStateEvaluator = GameStateEvaluator;
exports.filterBackwardsMove = filterBackwardsMove;
exports.filterCollisions = filterCollisions;
exports.filterTailCollision = filterTailCollision;
exports.filterHeadToHeadCollision = filterHeadToHeadCollision;
exports.getSafeMoves = getSafeMoves;
exports.chooseMoveTowardFood = chooseMoveTowardFood;
exports.getMoveDirection = getMoveDirection;
