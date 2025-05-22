const { runServer } = require('./server');
const { exec } = require('child_process');
const { platform } = require('os');
const path = require('path');
const fs = require('fs');
const handlers = require('./handlers');


const numSnakes = Number(process.argv[2]) || 1;
let serverPromises = [];

for (let i = 0; i < numSnakes; i++) {
  serverPromises.push(
    runServer(
      {
        info: () => handlers.info(i),
        start: handlers.start,
        move: handlers.move,
        end: handlers.end
      },
      i
    )
  );
}

Promise.all(serverPromises).then((ports) => {
  const args = ports
    .map(
      (port, idx) =>
        `--name "${handlers.info(idx).author}" --url http://localhost:${port}`
    )
    .join(' ');

  const isWindows = platform() === 'win32';

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

  const playCommand = `${binaryPath} play -W 11 -H 11 ${args} -g standard --browser -d 100`;

  console.log(`🐍 Starting Battlesnake with: ${playCommand}`);
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
