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

/**
 * GameStateEvaluator - Comprehensive game state evaluation system
 * 
 * This class provides methods to evaluate the current game state using multiple factors:
 * 1. Health and Survival Metrics
 * 2. Food Accessibility
 * 3. Space Control
 * 4. Threat Assessment
 * 5. Position Analysis
 * 6. Path Safety
 * 
 * Each factor is weighted and normalized to provide a complete evaluation of the game state.
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
  const evaluator = new GameStateEvaluator(gameState);
  const evaluation = evaluator.evaluateGameState();
  
  // Log evaluation results
  console.log('Game State Evaluation:');
  console.log(`Overall Score: ${evaluation.overallScore.toFixed(2)}`);
  console.log('Recommendations:', evaluation.recommendations);
  
  // Use evaluation to make decisions
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];
  // const myLength = gameState.you.body.length;
  
  // Calculate total board size for dynamic thresholds
  // This allows the snake to adapt its behavior based on map dimensions
  // const boardSize = gameState.board.width * gameState.board.height;

  // Initialize A* pathfinder with the game board
  // const pathfinder = new AStar(gameState.board);

  // Calculate dynamic thresholds based on board size
  // These thresholds scale with the map size to maintain appropriate behavior
  // on different board dimensions (small, standard, or large maps)
  // const minSafeArea = Math.max(3, Math.floor(boardSize * 0.1));     // At least 3 cells or 10% of board
  // const huntingThreshold = Math.max(50, Math.floor(boardSize * 0.2)); // Health threshold for hunting
  // const foodPriorityThreshold = Math.max(30, Math.floor(boardSize * 0.15)); // Health threshold for food priority

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
  gameState.you.body.forEach((snakePart) => {
    Object.entries(possibleMoves).forEach(([direction, value]) => {
      if (value.x === snakePart.x && value.y === snakePart.y) {
        value.safe = false;
      }
    });
  });

  // TODO: Step 3 - Prevent your Battlesnake from colliding with other Battlesnakes
  gameState.board.snakes.forEach((snake) => {
    snake.body.forEach((snakePart) => {
      Object.entries(possibleMoves).forEach(([direction, value]) => {
        if (value.x === snakePart.x && value.y === snakePart.y) {
          value.safe = false;
        }
      });
    });
  });

  //Iteration of Task 3 and 4, we don't need to check the tail bodypart of each snake
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

  // When choosing the next move, use the evaluation
  if (safeMoves.length > 0) {
    // Get path safety evaluation for each safe move
    const moveEvaluations = safeMoves.map(direction => {
      const newPos = evaluator.calculateNewPosition(myHead, direction);
      const pathSafety = evaluator.evaluatePathSafety();
      const moveScore = pathSafety.paths.find(p => p.direction === direction)?.score || 0;
      
      return { direction, score: moveScore };
    });

    // Sort moves by score and choose the best one
    moveEvaluations.sort((a, b) => b.score - a.score);
    const bestMove = moveEvaluations[0];
    
    console.log(`Selected move ${bestMove.direction} with score ${bestMove.score.toFixed(2)}`);
    return { move: bestMove.direction };
  }

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
 */
function floodFill(board, start) {
  // Get board dimensions - works with any map size
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


