import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const npmExecPath = process.env.npm_execpath;

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runNpm(scriptName) {
  if (npmExecPath) {
    run(process.execPath, [npmExecPath, 'run', scriptName]);
    return;
  }

  const fallbackNpmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(fallbackNpmCmd, ['run', scriptName]);
}

console.log('Step 1/3: Building web app...');
runNpm('build:web');

console.log('Step 2/3: Creating mobile package folder...');
runNpm('package:mobile');

console.log('Step 3/3: Starting web dev host...');
runNpm('dev:web');