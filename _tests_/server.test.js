// _tests_/server.test.js
const axios = require('axios');
const { runServer } = require('../server'); // adjust path if needed

let port;
let baseUrl;

describe('Server routes', () => {
  beforeAll(async () => {
    //mock handler functions
    const handlers = {
      info: () => 'Hello from Battlesnake!',
      start: jest.fn(),
      move: jest.fn(() => ({ move: 'up' })),
      end: jest.fn()
    };

    port = await runServer(handlers, 0);
    baseUrl = `http://localhost:${port}`;
  });

  test('GET / should return info', async () => {
    const response = await axios.get(`${baseUrl}/`);
    expect(response.status).toBe(200);
    expect(response.data).toBe('Hello from Battlesnake!');
  });

  test('POST /start should call handlers.start and return ok', async () => {
    const response = await axios.post(`${baseUrl}/start`, { game: 'start' });
    expect(response.status).toBe(200);
    expect(response.data).toBe('ok');
  });

  test('POST /move should return a move object', async () => {
    const response = await axios.post(`${baseUrl}/move`, { you: 'snake' });
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ move: 'up' });
  });

  test('POST /end should call handlers.end and return ok', async () => {
    const response = await axios.post(`${baseUrl}/end`, { game: 'end' });
    expect(response.status).toBe(200);
    expect(response.data).toBe('ok');
  });
});
