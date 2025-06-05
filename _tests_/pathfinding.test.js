/**
 * Test suite for A* Pathfinding Implementation
 * 
 * These tests verify that the A* algorithm correctly:
 * 1. Finds optimal paths between points
 * 2. Handles obstacles and blocked paths
 * 3. Evaluates different types of targets (food and snakes)
 * 4. Makes intelligent decisions about path selection
 */

const { AStar, Node } = require('../pathfinding');

describe('A* Pathfinding', () => {
  // Test setup: Create a mock game board
  let astar;
  const mockBoard = {
    width: 11,  // Standard Battlesnake board size
    height: 11
  };

  // Reset the A* instance before each test
  beforeEach(() => {
    astar = new AStar(mockBoard);
  });

  // Test Node class functionality
  describe('Node', () => {
    test('creates a node with correct properties', () => {
      const node = new Node(5, 5);
      // Verify all node properties are initialized correctly
      expect(node.x).toBe(5);
      expect(node.y).toBe(5);
      expect(node.walkable).toBe(true);
      expect(node.g).toBe(0);
      expect(node.h).toBe(0);
      expect(node.f).toBe(0);
      expect(node.parent).toBeNull();
    });

    test('equals method correctly compares nodes', () => {
      // Test node equality comparison
      const node1 = new Node(5, 5);
      const node2 = new Node(5, 5);
      const node3 = new Node(6, 5);
      expect(node1.equals(node2)).toBe(true);  // Same position
      expect(node1.equals(node3)).toBe(false); // Different position
    });
  });

  // Test A* algorithm functionality
  describe('AStar', () => {
    test('initializes grid with correct dimensions', () => {
      // Verify grid is created with proper size
      expect(astar.grid.length).toBe(mockBoard.width);
      expect(astar.grid[0].length).toBe(mockBoard.height);
    });

    test('finds direct path when no obstacles', () => {
      // Test basic pathfinding without obstacles
      const start = { x: 0, y: 0 };
      const end = { x: 5, y: 5 };
      const path = astar.findPath(start, end);
      
      // Verify path exists and connects start to end
      expect(path).not.toBeNull();
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toEqual({ x: 0, y: 0 });
      expect(path[path.length - 1]).toEqual({ x: 5, y: 5 });
    });

    test('returns null when no path exists', () => {
      // Test pathfinding with a wall blocking the path
      const gameState = {
        board: {
          width: mockBoard.width,
          height: mockBoard.height,
          snakes: [{
            // Create a vertical wall of snake body
            body: Array.from({ length: mockBoard.height }, (_, y) => ({ x: 5, y }))
          }]
        }
      };
      astar.updateGrid(gameState);

      // Try to find path through the wall
      const start = { x: 0, y: 0 };
      const end = { x: 10, y: 10 };
      const path = astar.findPath(start, end);
      expect(path).toBeNull();  // Should return null as no path exists
    });

    test('finds path around obstacles', () => {
      // Test pathfinding with an L-shaped obstacle
      const gameState = {
        board: {
          width: mockBoard.width,
          height: mockBoard.height,
          snakes: [{
            // Create an L-shaped snake body
            body: [
              { x: 5, y: 0 },
              { x: 5, y: 1 },
              { x: 5, y: 2 },
              { x: 5, y: 3 },
              { x: 5, y: 4 },
              { x: 6, y: 4 },
              { x: 7, y: 4 },
              { x: 8, y: 4 }
            ]
          }]
        }
      };
      astar.updateGrid(gameState);

      // Try to find path around the L-shaped obstacle
      const start = { x: 0, y: 0 };
      const end = { x: 10, y: 10 };
      const path = astar.findPath(start, end);
      
      // Verify path exists and doesn't intersect with obstacles
      expect(path).not.toBeNull();
      expect(path.length).toBeGreaterThan(0);
      path.forEach(point => {
        expect(gameState.board.snakes[0].body.some(part => 
          part.x === point.x && part.y === point.y
        )).toBe(false);
      });
    });

    test('evaluates path scores correctly for food targets', () => {
      // Test path scoring for food targets
      const gameState = {
        you: {
          health: 30,  // Low health
          body: [{ x: 0, y: 0 }]
        },
        board: {
          width: mockBoard.width,
          height: mockBoard.height,
          snakes: []
        }
      };

      // Test path scoring with low health
      const target = { x: 5, y: 5, food: true };
      const path = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
        { x: 5, y: 5 }
      ];
      const score = astar.evaluatePathScore(path, target, gameState);
      // Score should be lower when health is low (multiplied by 0.5)
      expect(score).toBe(path.length * 0.5);
    });

    test('evaluates path scores correctly for snake targets', () => {
      // Test path scoring for snake targets
      const gameState = {
        you: {
          body: Array(5).fill({ x: 0, y: 0 })  // Length 5 snake
        },
        board: {
          width: mockBoard.width,
          height: mockBoard.height,
          snakes: [{
            body: Array(3).fill({ x: 5, y: 5 })  // Length 3 snake
          }]
        }
      };

      // Test path scoring for hunting smaller snake
      const target = { x: 5, y: 5, snake: gameState.board.snakes[0] };
      const path = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 4 },
        { x: 5, y: 5 }
      ];
      const score = astar.evaluatePathScore(path, target, gameState);
      // Score should be adjusted based on length ratio (3/5)
      expect(score).toBe(path.length * (3/5));
    });

    test('finds best path among multiple targets', () => {
      // Test choosing the best target from multiple options
      const gameState = {
        you: {
          health: 100,  // High health
          body: [{ x: 0, y: 0 }]
        },
        board: {
          width: mockBoard.width,
          height: mockBoard.height,
          snakes: []
        }
      };

      // Test with multiple food targets at different distances
      const targets = [
        { x: 5, y: 5, food: true },  // Medium distance
        { x: 8, y: 8, food: true },  // Far distance
        { x: 2, y: 2, food: true }   // Close distance
      ];

      const path = astar.findBestPathToTargets({ x: 0, y: 0 }, targets, gameState);
      expect(path).not.toBeNull();
      // Should choose the closest food (2,2) when health is high
      expect(path[path.length - 1]).toEqual({ x: 2, y: 2 });
    });
  });
}); 