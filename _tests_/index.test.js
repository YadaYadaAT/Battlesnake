const axios = require('axios');
const { runServer } = require('../server');

let server;

beforeAll(async () => {
  server = await runServer();
});

afterAll(() => {
  server.close();
});

describe('Battlesnake Server Endpoints', () => {

  describe('GET /', () => {
    it('should return snake info', async () => {
      const res = await axios.get(`http://localhost:${server.address().port}/`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('apiversion');
      expect(res.data).toHaveProperty('author');
    });
  });

  describe('POST /start', () => {
    it('should log GAME START and return 200', async () => {
      const res = await axios.post(`http://localhost:${server.address().port}/start`, {
        turn: 0,
        game: { id: "game-id" },
        you: { id: "snake-id", body: [] },
        board: { height: 11, width: 11, food: [], snakes: [] }
      });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /move', () => {
    it('should return a valid move direction', async () => {
      const gameState = {
        turn: 1,
        game: { id: "game-id" },
        you: {
          id: "snake-id",
          body: [{ x: 5, y: 5 }, { x: 5, y: 4 }]
        },
        board: {
          height: 11,
          width: 11,
          food: [{ x: 2, y: 2 }],
          snakes: []
        }
      };

      const res = await axios.post(`http://localhost:${server.address().port}/move`, gameState);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('move');
      expect(['up', 'down', 'left', 'right']).toContain(res.data.move);
    });
  });

  describe('POST /end', () => {
    it('should log GAME OVER and return 200', async () => {
      const res = await axios.post(`http://localhost:${server.address().port}/end`, {
        turn: 100,
        game: { id: "game-id" },
        you: { id: "snake-id", body: [] },
        board: { height: 11, width: 11, food: [], snakes: [] }
      });
      expect(res.status).toBe(200);
    });
  });

});
