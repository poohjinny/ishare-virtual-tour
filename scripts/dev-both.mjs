/**
 * Run tour viewer + admin together for local platform work.
 * Prefer named scripts (`dev:viewer`, `dev:admin`) when you only need one.
 */
import { spawn } from 'node:child_process';

const children = [
  spawn('npm', ['run', 'dev:viewer'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  }),
  spawn('npm', ['run', 'dev:admin'], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  }),
];

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (signal) shutdown(1);
    shutdown(code ?? 0);
  });
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
