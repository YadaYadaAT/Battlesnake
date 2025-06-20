const {
  info,
  start,
  move,
  end,
  floodFill,
  GameStateEvaluator,
  filterBackwardsMove,
  filterCollisions,
  filterTailCollision,
  filterHeadToHeadCollision,
  getSafeMoves,
  chooseMoveTowardFood
} = require('../handlers');

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

describe('filterBackwardsMove', () => {
  test('removes the move that would go back toward the neck', () => {
    const possibleMoves = {
      up: { safe: true },
      down: { safe: true },
      left: { safe: true },
      right: { safe: true }
    };

    const myHead = { x: 2, y: 2 };
    const myNeck = { x: 2, y: 3 }; // came from below → going down is backwards

    filterBackwardsMove(possibleMoves, myHead, myNeck);

    expect(possibleMoves.down.safe).toBeFalsy(); // should be marked unsafe
    expect(possibleMoves.up.safe).toBeTruthy();
    expect(possibleMoves.left.safe).toBeTruthy();
    expect(possibleMoves.right.safe).toBeTruthy();
  });

  test('correctly removes left when snake came from the left', () => {
    const possibleMoves = {
      up: { safe: true },
      down: { safe: true },
      left: { safe: true },
      right: { safe: true }
    };

    const myHead = { x: 2, y: 2 };
    const myNeck = { x: 1, y: 2 };

    filterBackwardsMove(possibleMoves, myHead, myNeck);

    expect(possibleMoves.left.safe).toBeFalsy();
  });

  test('does not alter other directions', () => {
    const possibleMoves = {
      up: { safe: true },
      down: { safe: true },
      left: { safe: true },
      right: { safe: true }
    };

    const myHead = { x: 2, y: 2 };
    const myNeck = { x: 1, y: 2 }; // came from left

    filterBackwardsMove(possibleMoves, myHead, myNeck);

    expect(possibleMoves.right.safe).toBeTruthy();
    expect(possibleMoves.up.safe).toBeTruthy();
    expect(possibleMoves.down.safe).toBeTruthy();
  });
});

describe('filterCollisions', () => {
  const board = {
    snakes: [
      {
        body: [
          { x: 2, y: 2 },
          { x: 2, y: 3 }
        ]
      },
      {
        body: [
          { x: 0, y: 0 },
          { x: 0, y: 1 }
        ]
      }
    ]
  };

  const you = {
    body: [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 }
    ]
  };

  let possibleMoves;

  beforeEach(() => {
    possibleMoves = {
      up: { x: 1, y: 2, safe: true }, // your own body
      down: { x: 1, y: 0, safe: true }, // free space
      left: { x: 0, y: 0, safe: true }, // other snake body
      right: { x: 2, y: 2, safe: true } // another snake body
    };
  });

  test('marks moves colliding with your own body as unsafe', () => {
    filterCollisions(possibleMoves, { you, board });
    expect(possibleMoves.up.safe).toBe(false);
  });

  test('marks moves colliding with other snakes as unsafe', () => {
    filterCollisions(possibleMoves, { you, board });
    expect(possibleMoves.left.safe).toBe(false);
    expect(possibleMoves.right.safe).toBe(false);
  });

  test('does not mark safe moves unsafe', () => {
    filterCollisions(possibleMoves, { you, board });
    expect(possibleMoves.down.safe).toBe(true);
  });
});

describe('filterTailCollision', () => {
  const youId = 'you';
  let possibleMoves;
  let gameState;

  beforeEach(() => {
    possibleMoves = {
      up: { x: 2, y: 3, safe: true },
      down: { x: 2, y: 1, safe: true },
      left: { x: 1, y: 2, safe: true },
      right: { x: 3, y: 2, safe: true }
    };
  });

  test('marks moves unsafe if they collide with other snake tails that will NOT move (no food nearby)', () => {
    gameState = {
      you: { id: youId },
      board: {
        food: [],
        snakes: [
          {
            id: 'other1',
            body: [
              { x: 2, y: 2 },
              { x: 3, y: 2 }
            ] // tail at (3,2)
          }
        ]
      }
    };

    filterTailCollision(possibleMoves, gameState);

    // Since no food is near 'other1' head, tail is considered safe to move into
    // So moving into tail should be unsafe to avoid collision
    expect(possibleMoves.right.safe).toBe(true);

    // Other moves remain safe
    expect(possibleMoves.up.safe).toBe(true);
    expect(possibleMoves.down.safe).toBe(true);
    expect(possibleMoves.left.safe).toBe(true);
  });

  test('allows moves into tails of other snakes if those snakes will eat food (tail stays put)', () => {
    gameState = {
      you: { id: youId },
      board: {
        food: [{ x: 1, y: 2 }], // Food adjacent to other snake head
        snakes: [
          {
            id: 'other1',
            body: [
              { x: 0, y: 2 },
              { x: 1, y: 2 }
            ] // tail at (1,2)
          }
        ]
      }
    };

    filterTailCollision(possibleMoves, gameState);

    // Since other snake will eat food, tail will NOT move, so moving onto tail is unsafe
    expect(possibleMoves.left.safe).toBe(false);

    // Other moves remain safe
    expect(possibleMoves.up.safe).toBe(true);
    expect(possibleMoves.down.safe).toBe(true);
    expect(possibleMoves.right.safe).toBe(true);
  });

  test('does not mark your own tail moves unsafe', () => {
    gameState = {
      you: { id: youId },
      board: {
        food: [],
        snakes: [
          {
            id: youId,
            body: [
              { x: 2, y: 2 },
              { x: 3, y: 2 }
            ] // your tail at (3,2)
          }
        ]
      }
    };

    filterTailCollision(possibleMoves, gameState);

    // Your own tail moves should remain safe even if moving onto it
    expect(possibleMoves.right.safe).toBe(true);

    // Other moves remain safe
    expect(possibleMoves.up.safe).toBe(true);
    expect(possibleMoves.down.safe).toBe(true);
    expect(possibleMoves.left.safe).toBe(true);
  });
});

describe('filterHeadToHeadCollision', () => {
  const youId = 'you';
  let possibleMoves;
  let gameState;

  beforeEach(() => {
    possibleMoves = {
      up: { x: 2, y: 3, safe: true },
      down: { x: 2, y: 1, safe: true },
      left: { x: 1, y: 2, safe: true },
      right: { x: 3, y: 2, safe: true }
    };
  });

  test('marks moves unsafe if they move adjacent to an equal length snake head', () => {
    gameState = {
      you: { id: youId, body: Array(3).fill({}) }, // length 3
      board: {
        snakes: [
          {
            id: 'other1',
            body: [
              { x: 3, y: 3 },
              { x: 3, y: 2 },
              { x: 3, y: 1 }
            ] // length 3, head at (3,3)
          }
        ]
      }
    };

    filterHeadToHeadCollision(possibleMoves, gameState);

    // right move (3,2) is adjacent to other head at (3,3)
    expect(possibleMoves.right.safe).toBe(false);
    expect(possibleMoves.up.safe).toBe(false);

    // other moves remain safe
    expect(possibleMoves.down.safe).toBe(true);
    expect(possibleMoves.left.safe).toBe(true);
  });

  test('allows moves adjacent to a shorter snake head', () => {
    gameState = {
      you: { id: youId, body: Array(4).fill({}) }, // length 4
      board: {
        snakes: [
          {
            id: 'other1',
            body: [
              { x: 3, y: 3 },
              { x: 3, y: 2 }
            ] // length 2, head at (3,3)
          }
        ]
      }
    };

    filterHeadToHeadCollision(possibleMoves, gameState);

    // right move is adjacent but other snake is shorter, so safe
    expect(possibleMoves.right.safe).toBe(true);

    // all moves remain safe
    expect(possibleMoves.up.safe).toBe(true);
    expect(possibleMoves.down.safe).toBe(true);
    expect(possibleMoves.left.safe).toBe(true);
  });

  test('does not affect moves that are not adjacent to any snake head', () => {
    gameState = {
      you: { id: youId, body: Array(3).fill({}) },
      board: {
        snakes: [
          {
            id: 'other1',
            body: [
              { x: 0, y: 0 },
              { x: 0, y: 1 },
              { x: 0, y: 2 }
            ]
          }
        ]
      }
    };

    filterHeadToHeadCollision(possibleMoves, gameState);

    // All moves remain safe as none are adjacent to the other snake's head at (0,0)
    Object.values(possibleMoves).forEach((move) => {
      expect(move.safe).toBe(true);
    });
  });

  test('does not alter moves when there are no other snakes', () => {
    gameState = {
      you: { id: youId, body: Array(3).fill({}) },
      board: {
        snakes: [
          {
            id: youId,
            body: [
              { x: 2, y: 2 },
              { x: 2, y: 1 },
              { x: 2, y: 0 }
            ]
          }
        ]
      }
    };

    filterHeadToHeadCollision(possibleMoves, gameState);

    Object.values(possibleMoves).forEach((move) => {
      expect(move.safe).toBe(true);
    });
  });
});

describe('getSafeMoves', () => {
  test('returns keys of moves marked safe', () => {
    const possibleMoves = {
      up: { safe: true },
      down: { safe: false },
      left: { safe: true },
      right: { safe: false }
    };

    const safe = getSafeMoves(possibleMoves);
    expect(safe).toEqual(expect.arrayContaining(['up', 'left']));
    expect(safe).not.toContain('down');
    expect(safe).not.toContain('right');
  });

  test('returns empty array if no moves are safe', () => {
    const possibleMoves = {
      up: { safe: false },
      down: { safe: false }
    };

    const safe = getSafeMoves(possibleMoves);
    expect(safe).toEqual([]);
  });
});

describe('chooseMoveTowardFood', () => {
  let gameState;
  let myHead;
  let possibleMoves;
  let safeMoves;

  beforeEach(() => {
    myHead = { x: 2, y: 2 };
    possibleMoves = {
      up: { x: 2, y: 3, safe: true },
      down: { x: 2, y: 1, safe: true },
      left: { x: 1, y: 2, safe: true },
      right: { x: 3, y: 2, safe: true }
    };
    safeMoves = ['up', 'down', 'left', 'right'];

    gameState = {
      board: {
        food: []
      }
    };
  });

  test('returns random safe move when no food', () => {
    const move = chooseMoveTowardFood(
      gameState,
      myHead,
      safeMoves,
      possibleMoves
    );
    expect(safeMoves).toContain(move);
  });

  test('chooses primary direction toward nearest food', () => {
    gameState.board.food = [
      { x: 2, y: 4 },
      { x: 0, y: 2 }
    ];
    safeMoves = ['up', 'down', 'left'];

    // 'up' move is toward food at (2,4) which is nearest
    const move = chooseMoveTowardFood(
      gameState,
      myHead,
      safeMoves,
      possibleMoves
    );
    expect(['up', 'left']).toContain(move);
  });

  test('chooses secondary direction if primary is unsafe', () => {
    gameState.board.food = [{ x: 4, y: 2 }];
    safeMoves = ['up', 'right']; // only up and right are safe

    // For food at (4,2), primary direction is 'right', secondary is 'down'
    // 'right' is safe so it should pick 'right'
    const move = chooseMoveTowardFood(
      gameState,
      myHead,
      safeMoves,
      possibleMoves
    );
    expect(move).toBe('right');
  });

  test('returns random safe move if no preferred directions are safe', () => {
    gameState.board.food = [{ x: 0, y: 0 }];
    safeMoves = ['up', 'down']; // no 'left' or 'right' safe

    const move = chooseMoveTowardFood(
      gameState,
      myHead,
      safeMoves,
      possibleMoves
    );
    expect(['up', 'down']).toContain(move);
  });
});

describe('GameStateEvaluator', () => {
  const simpleGameState = {
    board: {
      width: 11,
      height: 11,
      food: [{ x: 3, y: 3 }],
      snakes: [
        {
          id: 'my-snake',
          body: [
            { x: 5, y: 5 },
            { x: 5, y: 4 },
            { x: 5, y: 3 }
          ],
          health: 90
        },
        {
          id: 'enemy-snake',
          body: [
            { x: 7, y: 7 },
            { x: 7, y: 6 }
          ]
        }
      ]
    },
    you: {
      id: 'my-snake',
      body: [
        { x: 5, y: 5 },
        { x: 5, y: 4 },
        { x: 5, y: 3 }
      ],
      health: 90
    }
  };

  test('evaluateGameState returns an evaluation object with expected keys', () => {
    const evaluator = new GameStateEvaluator(simpleGameState);
    const evalResult = evaluator.evaluateGameState();

    expect(evalResult).toHaveProperty('overallScore');
    expect(evalResult).toHaveProperty('factors');
    expect(evalResult.factors).toHaveProperty('health');
    expect(evalResult.factors).toHaveProperty('foodAccess');
    expect(evalResult.factors).toHaveProperty('spaceControl');
    expect(evalResult.factors).toHaveProperty('threatLevel');
    expect(evalResult.factors).toHaveProperty('position');
    expect(evalResult.factors).toHaveProperty('pathSafety');
    expect(Array.isArray(evalResult.recommendations)).toBe(true);
  });

  test('evaluateHealth returns critical status for low health', () => {
    const lowHealthState = JSON.parse(JSON.stringify(simpleGameState));
    lowHealthState.you.health = 10;
    lowHealthState.you.body = lowHealthState.you.body.slice(0, 2);

    const evaluator = new GameStateEvaluator(lowHealthState);
    const healthEval = evaluator.evaluateHealth();

    expect(healthEval.status).toBe('critical');
    expect(healthEval.isCritical).toBe(true);
  });

  test('evaluateThreats detects immediate threats', () => {
    const threatState = JSON.parse(JSON.stringify(simpleGameState));
    threatState.board.snakes.push({
      id: 'dangerous-snake',
      body: [
        { x: 6, y: 5 },
        { x: 6, y: 4 },
        { x: 6, y: 3 },
        { x: 6, y: 2 }
      ]
    });

    const evaluator = new GameStateEvaluator(threatState);
    const threatEval = evaluator.evaluateThreats();

    expect(threatEval.immediateThreats.length).toBeGreaterThan(0);
  });
});
