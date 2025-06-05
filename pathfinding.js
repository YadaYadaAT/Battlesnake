/**
 * A* Pathfinding Implementation for Battlesnake
 * 
 * This module implements the A* pathfinding algorithm for efficient navigation
 * in the Battlesnake game. It helps the snake find optimal paths to:
 * 1. Food items while avoiding obstacles
 * 2. Smaller snakes for hunting
 * 3. Safe spaces when in danger
 * 
 * The A* algorithm combines:
 * - g(n): Cost from start to current node
 * - h(n): Heuristic estimate to goal
 * - f(n) = g(n) + h(n): Total estimated cost
 */

/**
 * Represents a single cell/node in the game grid
 * Each node tracks its position, walkability, and pathfinding costs
 */
class Node {
  constructor(x, y, walkable = true) {
    this.x = x;                    // X coordinate in the grid
    this.y = y;                    // Y coordinate in the grid
    this.walkable = walkable;      // Whether the snake can move through this cell
    this.g = 0;                    // Cost from start to this node
    this.h = 0;                    // Heuristic cost from this node to end
    this.f = 0;                    // Total cost (g + h)
    this.parent = null;            // Reference to previous node in the path
  }

  /**
   * Compares this node with another node
   * @param {Node} other - The node to compare with
   * @returns {boolean} True if nodes are at the same position
   */
  equals(other) {
    return this.x === other.x && this.y === other.y;
  }
}

/**
 * A* Pathfinding Algorithm Implementation
 * Manages the game grid and finds optimal paths between points
 */
class AStar {
  /**
   * Creates a new A* pathfinder for the given board
   * @param {Object} board - The game board with width and height
   */
  constructor(board) {
    this.board = board;
    this.width = board.width;
    this.height = board.height;
    this.grid = this.initializeGrid();  // Create the initial empty grid
  }

  /**
   * Creates a 2D grid of nodes representing the game board
   * @returns {Array<Array<Node>>} 2D array of nodes
   */
  initializeGrid() {
    const grid = [];
    // Create a node for each cell in the grid
    for (let x = 0; x < this.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.height; y++) {
        grid[x][y] = new Node(x, y);
      }
    }
    return grid;
  }

  /**
   * Updates the grid based on current game state
   * Marks snake bodies as unwalkable and resets pathfinding data
   * @param {Object} gameState - Current state of the game
   */
  updateGrid(gameState) {
    // Reset all nodes to walkable and clear pathfinding data
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.grid[x][y].walkable = true;
        this.grid[x][y].g = 0;
        this.grid[x][y].h = 0;
        this.grid[x][y].f = 0;
        this.grid[x][y].parent = null;
      }
    }

    // Mark all snake bodies as unwalkable
    gameState.board.snakes.forEach(snake => {
      snake.body.forEach(part => {
        if (part.x >= 0 && part.x < this.width && part.y >= 0 && part.y < this.height) {
          this.grid[part.x][part.y].walkable = false;
        }
      });
    });
  }

  /**
   * Gets valid neighboring nodes for pathfinding
   * Only returns nodes that are within bounds and walkable
   * @param {Node} node - The node to get neighbors for
   * @returns {Array<Node>} Array of valid neighboring nodes
   */
  getNeighbors(node) {
    const neighbors = [];
    // Define possible movement directions (up, down, left, right)
    const directions = [
      { x: 0, y: 1 },   // up
      { x: 0, y: -1 },  // down
      { x: -1, y: 0 },  // left
      { x: 1, y: 0 }    // right
    ];

    // Check each direction
    for (const dir of directions) {
      const newX = node.x + dir.x;
      const newY = node.y + dir.y;

      // Only add if the neighbor is within bounds and walkable
      if (newX >= 0 && newX < this.width && 
          newY >= 0 && newY < this.height && 
          this.grid[newX][newY].walkable) {
        neighbors.push(this.grid[newX][newY]);
      }
    }

    return neighbors;
  }

  /**
   * Calculates the heuristic cost between two points
   * Uses Manhattan distance as it's suitable for grid-based movement
   * @param {Object} a - Start position {x, y}
   * @param {Object} b - End position {x, y}
   * @returns {number} Estimated cost between points
   */
  heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Finds the optimal path between two points using A* algorithm
   * @param {Object} start - Starting position {x, y}
   * @param {Object} end - Target position {x, y}
   * @returns {Array<Object>} Array of positions forming the path, or null if no path exists
   */
  findPath(start, end) {
    // Initialize open and closed sets
    const openSet = [this.grid[start.x][start.y]];  // Nodes to be evaluated
    const closedSet = new Set();                     // Nodes already evaluated

    while (openSet.length > 0) {
      // Find node with lowest f score
      let current = openSet[0];
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < current.f) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      // Move current node from open to closed set
      openSet.splice(currentIndex, 1);
      closedSet.add(current);

      // If we reached the end, reconstruct and return the path
      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(current);
      }

      // Check all neighbors
      for (const neighbor of this.getNeighbors(current)) {
        if (closedSet.has(neighbor)) continue;  // Skip if already evaluated

        const tentativeG = current.g + 1;  // Cost to reach neighbor through current

        // Add to open set if new node or better path found
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor);
        } else if (tentativeG >= neighbor.g) {
          continue;  // Skip if this path is not better
        }

        // Update neighbor's pathfinding data
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.h = this.heuristic(neighbor, end);
        neighbor.f = neighbor.g + neighbor.h;
      }
    }

    return null;  // No path found
  }

  /**
   * Reconstructs the path from end node to start node
   * @param {Node} node - The end node of the path
   * @returns {Array<Object>} Array of positions forming the path
   */
  reconstructPath(node) {
    const path = [];
    let current = node;

    // Follow parent references back to start
    while (current.parent) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }

  /**
   * Finds the best path to any of the given targets
   * Evaluates multiple targets and chooses the most efficient path
   * @param {Object} start - Starting position {x, y}
   * @param {Array<Object>} targets - Array of possible targets (food or snakes)
   * @param {Object} gameState - Current state of the game
   * @returns {Array<Object>} Best path to the most valuable target
   */
  findBestPathToTargets(start, targets, gameState) {
    this.updateGrid(gameState);
    
    let bestPath = null;
    let bestScore = Infinity;

    // Evaluate each target
    for (const target of targets) {
      const path = this.findPath(start, target);
      if (path) {
        // Calculate how good this path is
        const score = this.evaluatePathScore(path, target, gameState);
        if (score < bestScore) {
          bestScore = score;
          bestPath = path;
        }
      }
    }

    return bestPath;
  }

  /**
   * Evaluates how good a path is based on various factors
   * Considers path length, target type, and game state
   * @param {Array<Object>} path - The path to evaluate
   * @param {Object} target - The target (food or snake)
   * @param {Object} gameState - Current state of the game
   * @returns {number} Score for the path (lower is better)
   */
  evaluatePathScore(path, target, gameState) {
    // Start with path length as base score
    let score = path.length;

    // Adjust score based on target type
    if ('food' in target) {
      // Food target - consider health
      const health = gameState.you.health;
      if (health < 50) {
        // Prioritize food when health is low
        score *= 0.5;
      }
    } else if ('snake' in target) {
      // Snake target - consider length difference
      const myLength = gameState.you.body.length;
      const targetLength = target.snake.body.length;
      if (myLength > targetLength) {
        // Prioritize shorter snakes (lower score is better)
        score *= (targetLength / myLength);
      }
    }

    return score;
  }
}

module.exports = {
  AStar,
  Node
}; 