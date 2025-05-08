import nodemon from 'nodemon';
import { execSync } from 'child_process';

/* eslint-env node, es6 */

nodemon({ script: 'index.js' }).on('restart', () => {
  execSync('npm run play');
});
