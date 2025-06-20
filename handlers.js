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
  switch(move) {
    case 'up': newHead = { x: myHead.x, y: myHead.y + 1 }; break;
    case 'down': newHead = { x: myHead.x, y: myHead.y - 1 }; break;
    case 'left': newHead = { x: myHead.x - 1, y: myHead.y }; break;
    case 'right': newHead = { x: myHead.x + 1, y: myHead.y }; break;
  }

  // Update snake body
  mySnake.body.unshift(newHead);
  
  // Check if food was eaten
  const foodEaten = newState.board.food.some(food => 
    food.x === newHead.x && food.y === newHead.y
  );
  
  if (foodEaten) {
    // Remove eaten food
    newState.board.food = newState.board.food.filter(food => 
      !(food.x === newHead.x && food.y === newHead.y)
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
    const closestFood = gameState.board.food.reduce((closest, food) => {
      const distance = Math.abs(food.x - myHead.x) + Math.abs(food.y - myHead.y);
      return distance < closest.distance ? { food, distance } : closest;
    }, { distance: Infinity, food: null });
    
    if (closestFood.food) {
      score += Math.max(50 - closestFood.distance * 5, 0);
    }
  }

  // Factor 4: Hunting opportunities (0-50 points)
  const nearbySmallerSnakes = findNearbySmallerSnakes(gameState, myHead);
  score += Math.min(nearbySmallerSnakes.length * 25, 50);

  // Factor 5: Safety from larger snakes (-50 to 0 points)
  gameState.board.snakes.forEach(snake => {
    if (snake.id !== mySnake.id && snake.body.length > mySnake.body.length) {
      const distance = Math.abs(snake.body[0].x - myHead.x) + Math.abs(snake.body[0].y - myHead.y);
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
  const possibleMoves = ['up', 'down', 'left', 'right'];
  let bestScore = -Infinity;
  let bestMove = null;

  // Evaluate each possible move
  for (const move of possibleMoves) {
    // Skip invalid moves
    if (!isMoveSafe(gameState, move)) continue;

    // Simulate the move
    const newState = simulateMove(gameState, move);
    
    // If we're at max depth, just evaluate the resulting state
    if (depth === 1) {
      const score = evaluateGameState(newState);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    } else {
      // Look ahead further
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
 * Checks if a move is safe in the current game state
 * @param {Object} gameState - Current game state
 * @param {string} move - Move to check
 * @returns {boolean} Whether the move is safe
 */
function isMoveSafe(gameState, move) {
  const myHead = gameState.you.body[0];
  let newHead;

  // Calculate new head position
  switch(move) {
    case 'up': newHead = { x: myHead.x, y: myHead.y + 1 }; break;
    case 'down': newHead = { x: myHead.x, y: myHead.y - 1 }; break;
    case 'left': newHead = { x: myHead.x - 1, y: myHead.y }; break;
    case 'right': newHead = { x: myHead.x + 1, y: myHead.y }; break;
  }

  // Check board boundaries
  if (newHead.x < 0 || newHead.x >= gameState.board.width ||
      newHead.y < 0 || newHead.y >= gameState.board.height) {
    return false;
  }

  // Check collision with snakes
  for (const snake of gameState.board.snakes) {
    for (const part of snake.body) {
      if (part.x === newHead.x && part.y === newHead.y) {
        return false;
      }
    }
  }

  return true;
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
      health: 0.25,        // Health and survival importance
      foodAccess: 0.20,    // Food accessibility
      spaceControl: 0.20,  // Available space and territory
      threatLevel: 0.15,   // Threat assessment
      position: 0.10,      // Position evaluation
      pathSafety: 0.10     // Path safety evaluation
    };

    // Initialize thresholds
    this.thresholds = {
      criticalHealth: 30,          // Health level considered critical
      huntingHealth: 70,           // Health level for hunting
      minSafeArea: Math.max(3, Math.floor(this.boardSize * 0.1)),  // Minimum safe area
      immediateThreat: 2,          // Distance for immediate threat
      potentialThreat: 4           // Distance for potential threat
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
      (score, [factor, value]) => score + (value * this.weights[factor]),
      0
    );

    // Generate recommendations
    this.generateRecommendations(evaluation);

    return evaluation;
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
    let score = (healthScore * 0.6 + lengthScore * 0.4);
    if (health > 80) score += 0.1;  // Bonus for being well-fed
    if (status === 'critical') score *= 0.8;  // Penalty for critical health

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
   * Evaluates food accessibility and hunger management
   * @returns {Object} Food access evaluation with score and targets
   */
  evaluateFoodAccess() {
    if (!this.board.food.length) {
      return { score: 0, targets: [], isUrgent: false };
    }

    const myHead = this.mySnake.body[0];
    const targets = this.board.food.map(food => {
      const distance = Math.abs(food.x - myHead.x) + Math.abs(food.y - myHead.y);
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
      score: Math.min(1, (spaceScore * 0.5 + territoryScore * 0.3 + (escapeRoutes / 4) * 0.2)),
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

    this.board.snakes.forEach(snake => {
      if (snake.id === this.mySnake.id) return;

      const otherHead = snake.body[0];
      const otherLength = snake.body.length;
      const distance = Math.abs(otherHead.x - myHead.x) + Math.abs(otherHead.y - myHead.y);

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
      immediateThreats: threats.filter(t => t.isImmediate),
      potentialThreats: threats.filter(t => t.isPotential)
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
    const positionScore = (
      (wallDistance * 0.4) +
      ((1 - centerDistance) * 0.3) +
      ((escapeRoutes / 4) * 0.3)
    );

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
    const pathEvaluations = directions.map(direction => {
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
      score: Math.max(...pathEvaluations.map(p => p.score)),
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
      case 'up': return { x: head.x, y: head.y + 1 };
      case 'down': return { x: head.x, y: head.y - 1 };
      case 'left': return { x: head.x - 1, y: head.y };
      case 'right': return { x: head.x + 1, y: head.y };
      default: return head;
    }
  }

  isValidPosition(pos) {
    return pos.x >= 0 && pos.x < this.board.width &&
           pos.y >= 0 && pos.y < this.board.height;
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
    const distanceToCenter = Math.abs(myHead.x - centerX) + Math.abs(myHead.y - centerY);
    return 1 - (distanceToCenter / (this.board.width + this.board.height));
  }

  calculateFoodScore(distance, pathSafety) {
    const distanceScore = 1 - (distance / (this.board.width + this.board.height));
    return (distanceScore * 0.7 + pathSafety * 0.3);
  }

  evaluateThreatsAtPosition(pos) {
    return this.board.snakes
      .filter(snake => snake.id !== this.mySnake.id)
      .map(snake => ({
        snake,
        distance: Math.abs(snake.body[0].x - pos.x) + Math.abs(snake.body[0].y - pos.y),
        isDangerous: snake.body.length >= this.mySnake.body.length
      }));
  }

  calculatePathSafetyScore(area, threats) {
    const areaScore = area / this.boardSize;
    const threatScore = threats.reduce((score, threat) => {
      if (threat.distance <= this.thresholds.immediateThreat && threat.isDangerous) {
        return score - 0.3;
      }
      if (threat.distance <= this.thresholds.potentialThreat && threat.isDangerous) {
        return score - 0.1;
      }
      return score;
    }, 1);
    return Math.max(0, (areaScore * 0.6 + threatScore * 0.4));
  }
}

function move(gameState) {
  console.log(`MOVE ${gameState.turn}: Looking ahead for best move`);
  
  // Use look-ahead to find the best move
  const lookAheadMove = lookAhead(gameState, 2);
  
  if (lookAheadMove) {
    console.log(`MOVE ${gameState.turn}: Found best move through look-ahead`);
    return { move: lookAheadMove };
  }

  // Fallback to original move logic if look-ahead fails
  console.log(`MOVE ${gameState.turn}: Falling back to original move logic`);
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];
  // const myLength = gameState.you.body.length;
  
  // Calculate total board size for dynamic thresholds
  // This allows the snake to adapt its behavior based on map dimensions
  // const boardSize = gameState.board.width * gameState.board.height;

  const myLength = gameState.you.body.length;
  
  // Calculate total board size for dynamic thresholds
  // This allows the snake to adapt its behavior based on map dimensions
  const boardSize = gameState.board.width * gameState.board.height;

  // Initialize A* pathfinder with the game board
  const pathfinder = new AStar(gameState.board);

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

  //  // Avoid own body and other snakes
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
    const targetSnake = nearbySmallerSnakes[0];
    
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

    const huntingMoves = Object.entries(possibleMoves)
      .filter(([_, move]) => move.safe)
      .sort(([_, a], [__, b]) => (b.huntingScore || 0) - (a.huntingScore || 0));

    if (huntingMoves.length > 0) {
      const nextMove = huntingMoves[0][0];
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
      priority: gameState.you.health < 50 ? 1 : 2,
      area: foodArea
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
          priority: 1,
          area: snakeArea
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
      const nextArea = floodFill(gameState.board, nextPosition);
      if (nextArea > 3) {
        console.log(`MOVE ${gameState.turn}: Following A* path to target`);
        return { move: moveDirection };
      }
    }
  }

  let safestMove = safeMoves[0];
  let bestArea = 0;

  // Choose a random move from the safe moves
  //   const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
  for (const move of safeMoves) {
    const nextPos = possibleMoves[move];
    const area = floodFill(gameState.board, nextPos);
    if (area > bestArea) {
      bestArea = area;
      safestMove = move;
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
  return { move: nextMove || safestMove };
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


