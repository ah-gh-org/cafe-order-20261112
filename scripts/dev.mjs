// npm run dev: Web 画面の TypeScript をウォッチビルドしながら API サーバーを起動する（追加パッケージ不要）。
import { spawn } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const tscBin = require.resolve('typescript/bin/tsc');
const tsxCli = fileURLToPath(import.meta.resolve('tsx/cli'));

// npm run stop が dev のプロセス一式を止められるように PID を残す
const pidFile = fileURLToPath(new URL('../.dev.pid', import.meta.url));
writeFileSync(pidFile, String(process.pid));
process.on('exit', () => {
  try {
    if (readFileSync(pidFile, 'utf8').trim() === String(process.pid)) {
      rmSync(pidFile);
    }
  } catch {
    // すでに消えている
  }
});

const children = [
  spawn(process.execPath, [tscBin, '-p', 'tsconfig.web.json', '--watch', '--preserveWatchOutput'], {
    stdio: 'inherit',
  }),
  spawn(process.execPath, [tsxCli, 'watch', '--clear-screen=false', 'src/server.ts'], { stdio: 'inherit' }),
];

let stopping = false;

function stop(exitCode) {
  if (stopping) {
    return;
  }
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null) {
      child.kill();
    }
  }
}

for (const child of children) {
  child.on('exit', (code) => stop(code ?? 0));
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
