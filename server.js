const express = require('express');

exports.runServer = function (handlers, idx = 0) {
  return new Promise((res) => {
    const app = express();
    app.use(express.json());

    app.get('/', (req, res) => {
      res.send(handlers.info());
    });

    app.post('/start', (req, res) => {
      handlers.start(req.body);
      res.send('ok');
    });

    app.post('/move', (req, res) => {
      res.send(handlers.move(req.body));
    });

    app.post('/end', (req, res) => {
      handlers.end(req.body);
      res.send('ok');
    });

    app.use(function (req, res, next) {
      res.set('Server', 'battlesnake/github/starter-snake-javascript');
      next();
    });

    const host = '0.0.0.0';
    const port = (process.env.PORT || 8000) + idx;

    app.listen(port, host, () => {
      res(port);
    });
  });
};
