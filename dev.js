import nodemon from "nodemon";
import {execSync} from "child_process";

nodemon({ script: "index.js" }).on("restart", () => {
    execSync("npm run play");
});
