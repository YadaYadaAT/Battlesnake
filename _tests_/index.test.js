const { info, start, move, end } = require('../handlers');

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
        body: [{ x: 5, y: 5 }, { x: 5, y: 4 }],
        length: 3
      },
      board: {
        height: 11,
        width: 11,
        food: [{ x: 6, y: 5 }],
        snakes: [
          {
            id: 'snake-1',
            body: [{ x: 5, y: 5 }, { x: 5, y: 4 }],
          },
          {
            id: 'snake-2',
            body: [{ x: 3, y: 3 }, { x: 3, y: 2 }],
          }
        ],
      },
      turn: 0,
    };
    const moveResponse = move(gameState);
    expect(moveResponse).toHaveProperty('move');
    expect(['up', 'down', 'left', 'right']).toContain(moveResponse.move);
  });

  test('end() runs without error', () => {
    expect(() => end({})).not.toThrow();
  });
});
