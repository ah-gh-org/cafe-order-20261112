// npm run stop: npm run dev / npm start で起動したサーバーを止める（追加パッケージ不要）。
//   1. npm run dev が書いた PID ファイル（.dev.pid）があれば、dev のプロセス一式（ウォッチビルド含む）を止める
//   2. PORT（既定 3000）で待ち受けている Node.js のプロセスを止める（npm start 用）
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT ?? 3000);
const pidFile = fileURLToPath(new URL('../.dev.pid', import.meta.url));
const isWindows = process.platform === 'win32';

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return { ok: !result.error && result.status === 0, stdout: result.stdout ?? '' };
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

/** プロセスを止める。Windows では子プロセスもまとめて止める。 */
function kill(pid) {
  if (isWindows) {
    return run('taskkill', ['/PID', String(pid), '/T', '/F']).ok;
  }
  try {
    process.kill(pid, 'SIGTERM');
    return true;
  } catch {
    return false;
  }
}

function readDevPid() {
  try {
    const pid = Number(readFileSync(pidFile, 'utf8').trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

/** PORT で待ち受けている Node.js プロセスの PID を返す。 */
function findNodeListeners() {
  if (isWindows) {
    const netstat = run('netstat', ['-ano', '-p', 'tcp']);
    const pids = new Set();
    for (const line of netstat.stdout.split(/\r?\n/)) {
      const columns = line.trim().split(/\s+/);
      if (columns[0] === 'TCP' && columns[3] === 'LISTENING' && columns[1]?.endsWith(`:${port}`)) {
        pids.add(Number(columns[4]));
      }
    }
    return [...pids].filter((pid) => {
      const task = run('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']);
      return /^"node(\.exe)?"/i.test(task.stdout.trim());
    });
  }
  const lsof = run('lsof', ['-a', '-c', 'node', `-iTCP:${port}`, '-sTCP:LISTEN', '-t']);
  return lsof.stdout
    .split('\n')
    .map(Number)
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

let stopped = 0;

const devPid = readDevPid();
if (devPid !== null && isAlive(devPid) && kill(devPid)) {
  console.log(`🛑 npm run dev を停止しました（PID ${devPid}）`);
  stopped += 1;
}
rmSync(pidFile, { force: true });

for (const pid of findNodeListeners()) {
  if (pid !== devPid && kill(pid)) {
    console.log(`🛑 ポート ${port} のサーバーを停止しました（PID ${pid}）`);
    stopped += 1;
  }
}

if (stopped === 0) {
  console.log(`停止するサーバーは見つかりませんでした（ポート ${port}）`);
}
