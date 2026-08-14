import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;
const isWindows = process.platform === 'win32';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  amber: '\x1b[38;5;214m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

console.log(`\n${colors.amber}${colors.bold}================================================================${colors.reset}`);
console.log(`${colors.amber}${colors.bold}                 VerifyHire Development Runner                   ${colors.reset}`);
console.log(`${colors.amber}   Candidate Verification Platform for US IT Recruiters        ${colors.reset}`);
console.log(`${colors.amber}${colors.bold}================================================================${colors.reset}\n`);

const children = [];

function resolveBin(pkg, subpath) {
  return path.join(rootDir, 'node_modules', pkg, subpath);
}

function runProcess(name, execPath, args, cwd, color) {
  console.log(`${colors.bold}[${name}]${colors.reset} Starting in ${colors.gray}${cwd}${colors.reset}...`);

  const proc = spawn(execPath, args, {
    cwd: path.resolve(__dirname, cwd),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

  children.push({ name, proc });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line) {
        console.log(`${color}${colors.bold}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line) {
        console.error(`${colors.red}${colors.bold}[${name}-ERR]${colors.reset} ${line}`);
      }
    });
  });

  proc.on('error', (err) => {
    console.error(`${colors.red}${colors.bold}[${name}-ERROR]${colors.reset} ${err.message}`);
  });

  proc.on('exit', (code, signal) => {
    if (code !== null) {
      console.log(`${colors.bold}[${name}]${colors.reset} Process exited with code ${colors.bold}${code}${colors.reset}`);
    } else if (signal !== null) {
      console.log(`${colors.bold}[${name}]${colors.reset} Process was terminated by signal ${colors.bold}${signal}${colors.reset}`);
    }
  });
}

const nodeExec = process.execPath;

// 1. Frontend (Vite) — direct, no npm overhead
runProcess('Frontend', nodeExec, [resolveBin('vite', 'bin/vite.js')], 'smarthire-react', colors.green);

// 2. Backend (Nodemon)
runProcess('Backend', nodeExec, [resolveBin('nodemon', 'bin/nodemon.js'), '--ignore', 'node_modules/', 'server.js'], 'smarthire-backend', colors.cyan);

// 3. Mock API (Nodemon)
runProcess('Mock-API', nodeExec, [resolveBin('nodemon', 'bin/nodemon.js'), '--ignore', 'node_modules/', '--ignore', 'server/*.json', '--ignore', 'server/uploads/', 'server/index.js'], 'smarthire-react', colors.amber);

// Handle cleanup on exit
const cleanup = () => {
  console.log(`\n\n${colors.amber}${colors.bold}Stopping all active servers...${colors.reset}`);
  
  children.forEach(({ name, proc }) => {
    if (proc.pid && !proc.killed) {
      console.log(`${colors.gray}Shutting down ${name} (PID: ${proc.pid})...${colors.reset}`);
      if (isWindows) {
        // Use taskkill on Windows to ensure child processes spawned by shell are also killed
        try {
          spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
        } catch (e) {
          proc.kill('SIGINT');
        }
      } else {
        proc.kill('SIGINT');
      }
    }
  });
  
  setTimeout(() => {
    console.log(`${colors.green}${colors.bold}All servers stopped successfully. Goodbye!${colors.reset}\n`);
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGHUP', cleanup);
