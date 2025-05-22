const { runServer } = require('./server');
const { exec } = require('child_process');
const handlers = require('./handlers'); // import your handlers here

let serverPromises = [];
for (let i = 0; i < Number(process.argv[2]); i++) {
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
        `--name ${handlers.info(idx).author} --url http://localhost:${port}`
    )
    .join(' ');

  exec(
    `${process.cwd()}/battlesnake/battlesnake.exe  play -W 11 -H 11 ${args} -g standard --browser -d 100`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );
});
