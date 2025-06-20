const { info, start, move, end, floodFill } = require('../handlers');

describe('Battlesnake core functions', () => {
  test('info() returns correct snake info', () => {
    const snakeInfo = info(0);
    expect(snakeInfo).toHaveProperty('author', 'Anastasia');
    expect(snakeInfo).toHaveProperty('apiversion', '1');
    expect(typeof snakeInfo.color).toBe('string');
    expect(snakeInfo).toHaveProperty('head');
    expect(snakeInfo).toHaveProperty('tail');
  });

  test('start() runs without error and can accept game state', () => {
    expect(() =>
      start({ game: { id: 'test-game' }, turn: 0, board: {}, you: {} })
    ).not.toThrow();
  });

  test('move() returns a valid move when snake is surrounded on one side', () => {
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
              { x: 5, y: 6 }, // blocking downward move
              { x: 5, y: 7 }
            ]
          }
        ]
      },
      turn: 0
    };
    const moveResponse = move(gameState);
    expect(moveResponse).toHaveProperty('move');
    expect(['up', 'left', 'right']).toContain(moveResponse.move);
    expect(moveResponse.move).not.toBe('down'); // blocked by snake-2
  });

  test('move() returns a move even when no food is on board', () => {
    const gameState = {
      you: {
        id: 'snake-1',
        body: [
          { x: 0, y: 0 },
          { x: 0, y: 1 }
        ],
        length: 1
      },
      board: {
        height: 2,
        width: 2,
        food: [],
        snakes: [{ id: 'snake-1', body: [{ x: 0, y: 0 }] }]
      },
      turn: 1
    };
    const moveResponse = move(gameState);
    expect(moveResponse).toHaveProperty('move');
    expect(['up', 'down', 'left', 'right']).toContain(moveResponse.move);
  });

  test('end() runs without error and can accept game state', () => {
    expect(() =>
      end({ game: { id: 'test-game' }, turn: 100, board: {}, you: {} })
    ).not.toThrow();
  });
});

describe('Flood fill algorithm', () => {
  const boardWidth = 5;
  const boardHeight = 5;

  // Helper to create board object with snakes and food (food ignored by floodFill)
  const createBoard = (snakeBodies = []) => ({
    width: boardWidth,
    height: boardHeight,
    snakes: snakeBodies.map((body, idx) => ({ id: `snake-${idx}`, body }))
  });

  test('flood fill returns full area if no obstacles', () => {
    const board = createBoard([]);
    const start = { x: 2, y: 2 };
    const result = floodFill(board, start);
    expect(result).toBe(boardWidth * boardHeight);
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
    expect(result).toBe(boardWidth * boardHeight - snakeBody.length);
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
    expect(result).toBeLessThan(boardWidth * boardHeight);
  });

  test('flood fill does not count out-of-bounds positions', () => {
    const board = createBoard([]);
    const start = { x: -1, y: 0 }; // invalid start
    const result = floodFill(board, start);
    expect(result).toBe(0);
  });

  test('flood fill with multiple snake bodies scattered', () => {
    const snake1 = [
      { x: 1, y: 1 },
      { x: 1, y: 2 }
    ];
    const snake2 = [
      { x: 3, y: 3 },
      { x: 4, y: 4 }
    ];
    const board = createBoard([snake1, snake2]);
    const start = { x: 0, y: 0 };
    const result = floodFill(board, start);
    expect(result).toBe(
      boardWidth * boardHeight - snake1.length - snake2.length
    );
  });
});
