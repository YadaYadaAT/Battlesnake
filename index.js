/**
 * Battlesnake Server Startup
 * 
 * This file handles starting the Battlesnake server with configurable map sizes.
 * Map sizes can be specified as command line arguments:
 * - argv[2]: Number of snakes (default: 1)
 * - argv[3]: Board width (default: 11)
 * - argv[4]: Board height (default: 11)
 * 
 * Example usage:
 * - Standard 11x11 board: node index.js 1
 * - Small 7x7 board: node index.js 1 7 7
 * - Large 19x19 board: node index.js 1 19 19
 */

const { runServer } = require('./server');
const { exec } = require('child_process');
const { platform } = require('os');
const path = require('path');
const fs = require('fs');
const handlers = require('./handlers');

// Parse command line arguments for game configuration
const numSnakes = Number(process.argv[2]) || 1;
const boardWidth = Number(process.argv[3]) || 11;  // Default to standard 11x11 board
const boardHeight = Number(process.argv[4]) || 11; // Default to standard 11x11 board

/**
 * Stores promises for starting multiple Battlesnake servers.
 * @type {Promise<number>[]}
 */
let serverPromises = [];

for (let i = 0; i < numSnakes; i++) {
  serverPromises.push(
    runServer(
      {
        /**
         * Get snake info based on index.
         * @returns {Object}
         */
        info: () => handlers.info(i),

        /** @param {Object} gameState */
        start: handlers.start,

        /** @param {Object} gameState */
        move: handlers.move,

        /** @param {Object} gameState */
        end: handlers.end
      },
      i
    )
  );
}

Promise.all(serverPromises).then((ports) => {
  /**
   * Construct the --name and --url arguments for the battlesnake CLI.
   * @type {string}
   */
  const args = ports
    .map(
      (port, idx) =>
        `--name "${handlers.info(idx).author}" --url http://localhost:${port}`
    )
    .join(' ');

  const isWindows = platform() === 'win32';

  /**
   * Full path to the Battlesnake binary based on the platform.
   * @type {string}
   */
  const binaryPath = isWindows
    ? path.join(process.cwd(), 'battlesnake', 'battlesnake.exe')
    : path.join(process.cwd(), 'battlesnake', 'battlesnake-linux');

  if (!fs.existsSync(binaryPath)) {
    console.error(`❌ Battlesnake binary not found at: ${binaryPath}`);
    process.exit(1);
  }

  // Make sure it's executable in Linux
  if (!isWindows) {
    fs.chmodSync(binaryPath, '755');
  }


  // Configure the game with the specified board dimensions
  const playCommand = `${binaryPath} play -W ${boardWidth} -H ${boardHeight} ${args} -g standard --browser -d 100`;

  console.log(`🐍 Starting Battlesnake with board size ${boardWidth}x${boardHeight}`);
  exec(playCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Execution error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ stderr: ${stderr}`);
    }
    if (stdout) {
      console.log(`✅ stdout:\n${stdout}`);
    }
  });
});