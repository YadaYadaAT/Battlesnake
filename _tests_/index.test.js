const { info, start, move, end } = require('../handlers');
const { floodFill } = require('../handlers');

describe('Battlesnake core functions', () => {
  test('info() returns correct snake info', () => {
    const snakeInfo = info(0); // test the first info object explicitly
    expect(snakeInfo).toHaveProperty('author', 'Anastasia');
    expect(snakeInfo).toHaveProperty('apiversion', '1');
    expect(typeof snakeInfo.color).toBe('string');
  });

  test('start() runs without error', () => {
    expect(() => start({})).not.toThrow();
  });

  test('move() returns a valid move', () => {
    const gameState = {
      you: {
        id: 'snake-1',
        body: [
          { x: 5, y: 5 },
          { x: 5, y: 4 }
        ],
        length: 3
      },
      board: {
        height: 11,
        width: 11,
        food: [{ x: 6, y: 5 }],
        snakes: [
          {
            id: 'snake-1',
            body: [
              { x: 5, y: 5 },
              { x: 5, y: 4 }
            ]
          },
          {
            id: 'snake-2',
            body: [
              { x: 3, y: 3 },
              { x: 3, y: 2 }
            ]
          }
        ]
      },
      turn: 0
    };
    const moveResponse = move(gameState);
    expect(moveResponse).toHaveProperty('move');
    expect(['up', 'down', 'left', 'right']).toContain(moveResponse.move);
  });

  test('end() runs without error', () => {
    expect(() => end({})).not.toThrow();
  });
});

describe('Flood fill algorithm', () => {
  const boardWidth = 5;
  const boardHeight = 5;

  // A helper to create a game board object with snakes and food
  const createBoard = (snakeBodies = []) => ({
    width: boardWidth,
    height: boardHeight,
    snakes: snakeBodies.map((body, idx) => ({ id: `snake-${idx}`, body }))
  });

  test('flood fill returns full area if no obstacles', () => {
    const board = createBoard([]);
    const start = { x: 2, y: 2 };
    const result = floodFill(board, start);
    expect(result).toBe(boardWidth * boardHeight); // entire board reachable
  });

  test('flood fill respects snake bodies as obstacles', () => {
    const snakeBody = [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 3, y: 2 }
    ];
    const board = createBoard([snakeBody]);
    const start = { x: 0, y: 0 };
    const result = floodFill(board, start);
    // Should not include cells occupied by snake parts
    // The reachable area is the entire board minus the 3 blocked cells
    expect(result).toBe(boardWidth * boardHeight - 3);
  });

  test('flood fill returns 0 if start position is occupied', () => {
    const snakeBody = [{ x: 1, y: 1 }];
    const board = createBoard([snakeBody]);
    const start = { x: 1, y: 1 };
    const result = floodFill(board, start);
    expect(result).toBe(0);
  });

  test('flood fill handles edges correctly', () => {
    const snakeBody = [
      { x: 0, y: 0 },
      { x: 0, y: 1 }
    ];
    const board = createBoard([snakeBody]);
    const start = { x: 1, y: 0 };
    const result = floodFill(board, start);
    expect(result).toBeGreaterThan(0);
  });
});
