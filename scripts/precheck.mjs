#!/usr/bin/env node
// ハンズオンの事前チェック（npm run precheck）。追加パッケージなしで動く。
//   npm run precheck                      参加者用
//   npm run precheck -- --allow-user-owner  ファシリテーターの予行演習用（個人所有のリポジトリを許可）
//   npm run precheck -- --stretch           発展課題（スタック PR）用に gh stack 拡張機能も確認
import { spawnSync } from 'node:child_process';

const MIN_NODE_MAJOR = 24;
const MIN_GH_VERSION = [2, 90, 0];

const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) {
  console.log(`使い方: npm run precheck [-- [--allow-user-owner] [--stretch]]

  --allow-user-owner  リポジトリの所有者が個人アカウントでもエラーにしない（予行演習用）
  --stretch           発展課題（スタック PR）で使う gh stack 拡張機能も確認する`);
  process.exit(0);
}
const allowUserOwner = args.has('--allow-user-owner');
const stretch = args.has('--stretch');

const results = [];

function record(status, title, hint) {
  results.push({ status, title, hint });
  const icon = { ok: '✅', warn: '⚠️ ', ng: '❌' }[status];
  console.log(`${icon} ${title}`);
  if (hint && status !== 'ok') {
    for (const line of hint.split('\n')) {
      console.log(`   ${line}`);
    }
  }
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', ...options });
  return {
    ok: !result.error && result.status === 0,
    missing: result.error?.code === 'ENOENT',
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  };
}

function parseVersion(text) {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(text);
  return match ? match.slice(1, 4).map(Number) : null;
}

function isAtLeast(version, minimum) {
  for (let i = 0; i < minimum.length; i += 1) {
    if (version[i] !== minimum[i]) {
      return version[i] > minimum[i];
    }
  }
  return true;
}

/** origin の URL から host / owner / repo を取り出す（https と ssh の両方に対応）。 */
function parseRemote(url) {
  const match =
    /^(?:https?:\/\/(?:[^@/]+@)?|ssh:\/\/(?:[^@/]+@)?|[^@/]+@)([^/:]+)(?::\d+)?[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url);
  return match ? { host: match[1], owner: match[2], repo: match[3] } : null;
}

console.log('☕ Bean & Byte Café ハンズオン 事前チェック\n');

// 1. Node.js
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor >= MIN_NODE_MAJOR) {
  record('ok', `Node.js ${process.versions.node}`);
} else {
  record(
    'ng',
    `Node.js ${process.versions.node}（${MIN_NODE_MAJOR} 以上が必要です）`,
    '対処: Node.js 24 LTS をインストールしてください（nvm を使う場合: nvm install 24 && nvm use 24）',
  );
}

// 2. git
const git = run('git', ['--version']);
if (git.ok) {
  record('ok', git.stdout.replace('git version', 'git'));
} else {
  record('ng', 'git が見つかりません', '対処: https://git-scm.com/ から git をインストールしてください');
}

// 3. GitHub CLI
const gh = run('gh', ['--version']);
const ghVersion = gh.ok ? parseVersion(gh.stdout) : null;
if (!gh.ok) {
  record('ng', 'GitHub CLI（gh）が見つかりません', '対処: https://cli.github.com/ から gh をインストールしてください');
} else if (!ghVersion || !isAtLeast(ghVersion, MIN_GH_VERSION)) {
  record(
    'ng',
    `GitHub CLI ${ghVersion?.join('.') ?? '(不明)'}（${MIN_GH_VERSION.join('.')} 以上が必要です）`,
    '対処: gh を最新版に更新してください（例: brew upgrade gh / winget upgrade GitHub.cli）',
  );
} else {
  record('ok', `GitHub CLI ${ghVersion.join('.')}`);
}

// 4. origin リポジトリ
const originUrl = git.ok ? run('git', ['remote', 'get-url', 'origin']) : null;
const remote = originUrl?.ok ? parseRemote(originUrl.stdout) : null;
if (!remote) {
  record(
    'ng',
    'このフォルダーに origin リモートがありません',
    '対処: テンプレートから作った自分のリポジトリを git clone し、そのフォルダーで実行してください',
  );
}

// 5. gh のログイン
let loggedIn = false;
if (gh.ok && remote) {
  const auth = run('gh', ['auth', 'status', '--hostname', remote.host]);
  const login = auth.ok ? run('gh', ['api', 'user', '--hostname', remote.host, '--jq', '.login']) : null;
  if (login?.ok) {
    loggedIn = true;
    record('ok', `gh のログイン: ${login.stdout}（${remote.host}）`);
  } else {
    record(
      'ng',
      `gh が ${remote.host} にログインしていません`,
      `対処: gh auth login --hostname ${remote.host} を実行し、会社の GitHub アカウント（EMU）でログインしてください`,
    );
  }
}

// 6. gh stack 拡張機能（発展課題でだけ使うので --stretch のときだけ確認）
if (gh.ok && stretch) {
  const stack = run('gh', ['stack', '--version']);
  const stackVersion = stack.ok ? parseVersion(stack.stdout) : null;
  if (stackVersion) {
    record('ok', `gh stack ${stackVersion.join('.')}`);
  } else {
    record('ng', 'gh stack 拡張機能がありません', '対処: gh extension install github/gh-stack');
  }
}

// 7〜9. リポジトリの権限・Issues・所有者
if (loggedIn && remote) {
  const repo = run('gh', [
    'api',
    `repos/${remote.owner}/${remote.repo}`,
    '--hostname',
    remote.host,
    '--jq',
    '{fullName: .full_name, push: .permissions.push, hasIssues: .has_issues, ownerType: .owner.type}',
  ]);
  if (!repo.ok) {
    record(
      'ng',
      `リポジトリ ${remote.owner}/${remote.repo} にアクセスできません`,
      '対処: URL と、gh でログインしているアカウントを確認してください（gh auth status）',
    );
  } else {
    const info = JSON.parse(repo.stdout);
    if (info.push) {
      record('ok', `リポジトリ ${info.fullName} にプッシュできる`);
    } else {
      record(
        'ng',
        `リポジトリ ${info.fullName} へのプッシュ権限がありません`,
        '対処: 自分で「Use this template」から作ったリポジトリか確認してください（他の人のリポジトリではなく）',
      );
    }

    if (info.hasIssues) {
      record('ok', 'Issues が有効');
    } else {
      record('ng', 'Issues が無効です', '対処: リポジトリの Settings → General → Features で Issues をオンにしてください');
    }

    if (info.ownerType === 'Organization') {
      record('ok', `所有者は Organization（${remote.owner}）`);
    } else {
      const explanation = [
        `所有者が個人アカウント（${remote.owner}）です。Enterprise Managed Users の個人アカウントのリポジトリでは`,
        'GitHub ホストランナーが使えないため、CI（GitHub Actions）が動きません。',
        '対処: テンプレートの「Use this template」で Owner にワークショップ用 Organization を選んで作り直してください。',
      ].join('\n');
      record(allowUserOwner ? 'warn' : 'ng', `所有者が Organization ではありません（${info.ownerType}）`, explanation);
    }
  }
}

// 10. テスト
const npmExecPath = process.env.npm_execpath;
const npmTest = npmExecPath
  ? run(process.execPath, [npmExecPath, 'test'])
  : process.platform === 'win32'
    ? run('npm test', [], { shell: true })
    : run('npm', ['test']);
if (npmTest.ok) {
  record('ok', 'npm test が成功');
} else {
  const output = `${npmTest.stdout}\n${npmTest.stderr}`.trim().split('\n').slice(-8).join('\n');
  record('ng', 'npm test が失敗しました', `対処: npm ci を実行してから再度お試しください。\n--- 出力（末尾）---\n${output}`);
}

const ng = results.filter((result) => result.status === 'ng').length;
const warn = results.filter((result) => result.status === 'warn').length;
console.log(`\n結果: ${results.length} 項目中 OK ${results.length - ng - warn} / 警告 ${warn} / NG ${ng}`);
if (ng > 0) {
  console.log('❌ NG の項目を直してから、もう一度 npm run precheck を実行してください。');
  process.exit(1);
}
console.log('✅ 準備完了です。ハンズオンでお会いしましょう！');
