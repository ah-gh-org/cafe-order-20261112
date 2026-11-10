// CI のジョブサマリー用に、Vitest のカバレッジ結果（coverage/coverage-summary.json）を Markdown 表で出力する。
import { existsSync, readFileSync } from 'node:fs';

const summaryPath = new URL('../coverage/coverage-summary.json', import.meta.url);
const THRESHOLD = 80;
const METRICS = [
  ['lines', '行 (Lines)'],
  ['branches', '分岐 (Branches)'],
  ['functions', '関数 (Functions)'],
  ['statements', '文 (Statements)'],
];

if (!existsSync(summaryPath)) {
  console.log('## カバレッジ\n\n⚠️ coverage/coverage-summary.json がありません（テストが途中で失敗した可能性があります）。');
  process.exit(0);
}

const { total } = JSON.parse(readFileSync(summaryPath, 'utf8'));
const rows = METRICS.map(([key, label]) => {
  const { pct, covered, total: count } = total[key];
  const mark = pct >= THRESHOLD ? '✅' : '❌';
  return `| ${label} | ${pct.toFixed(2)}% | ${covered} / ${count} | ${mark} |`;
});

console.log(
  [
    '## カバレッジ',
    '',
    `しきい値: ${THRESHOLD}%（vitest.config.ts）`,
    '',
    '| 指標 | カバレッジ | カバー数 | 判定 |',
    '| --- | ---: | ---: | :---: |',
    ...rows,
  ].join('\n'),
);
