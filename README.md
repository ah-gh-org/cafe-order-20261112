# Bean & Byte Café 注文アプリ（GitHub Copilot ハンズオン）

架空のカフェ「Bean & Byte Café」の小さな注文アプリです。
このリポジトリを使って、**既存のシステムに機能を追加する**開発の流れを GitHub Copilot と一緒に体験します。

```mermaid
flowchart LR
  A[Issue を作る] --> B[Copilot で計画<br>Plan エージェント]
  B --> C[Copilot で実装・テスト<br>エージェントモード]
  C --> D[CI<br>GitHub Actions]
  D --> E[Copilot コードレビュー]
  E --> G[Copilot が指摘を<br>修正]
  G --> H[アプリを動かして<br>動作確認]
  H --> F[マージ]
```

演習では「クーポンコード」機能を PR で届けます。アプリの動作確認は 2 回行います。1 回目は実装の直後で、使えないコードと使えるコードを 1 つずつ試し、「OK」と返すと Copilot が PR を作ります。2 回目は Copilot コードレビューの指摘を Copilot が修正したあとで、VS Code の GitHub Pull Requests 拡張機能で PR をチェックアウトし、`npm run dev` で確認します。時間に余裕がある人向けに [発展課題](#発展課題スタック-pr) もあります。

## ドキュメント

| 対象 | ドキュメント | 内容 |
| --- | --- | --- |
| 参加者 | [docs/01-exercise-guide.md](docs/01-exercise-guide.md) | ハンズオン本編と発展課題 |

## 必要なもの

- Node.js 24（`.nvmrc`）と npm
- git、GitHub CLI（`gh`）2.90 以上
- VS Code と拡張機能（GitHub Copilot Chat、GitHub Pull Requests、ESLint、Vitest、REST Client）

## 動かし方

```bash
npm ci
npm run dev
```

ブラウザで http://localhost:3000 を開くと、メニューから商品を選んで注文できます。
API は [requests.http](requests.http)（REST Client）から試せます。

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | API サーバーと画面のビルドをウォッチモードで起動（http://localhost:3000） |
| `npm run build` / `npm start` | ビルドして `dist/` から起動 |
| `npm run stop` | `npm run dev` / `npm start` で起動したサーバーを停止 |
| `npm test` | テスト（Vitest） |
| `npm run test:coverage` | テスト + カバレッジ（行・分岐・関数・文すべて 80% 以上が必要） |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript の型チェック（サーバー・画面・テスト） |
| `npm run precheck` | ハンズオンの事前チェック |

## API

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | `/health` | ヘルスチェック |
| GET | `/api/products` | メニュー一覧 |
| GET | `/api/products/:id` | メニュー 1 件 |
| POST | `/api/orders` | 注文する（`{ "items": [{ "productId": "latte", "quantity": 2 }] }`） |
| GET | `/api/orders/:id` | 注文を取得する |

エラーは次の形式で返します（400 / 404 / 500）。

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed", "details": {} } }
```

## 構成

```text
src/
  domain/        型と値（Product、Order、金額 Yen、Clock）
  repositories/  インメモリのリポジトリとメニューのシード
  services/      業務ロジック（pricing.ts は純粋関数）
  http/          AppError、エラーハンドラー、zod の検証
  routes/        health、products、orders のルーター
  web/           画面の TypeScript（view.ts は HTML を返す純粋関数）
  app.ts         createApp({ clock, repositories })
  server.ts      起動（PORT、既定 3000）
public/          index.html、styles.css（js/ はビルド結果）
scripts/         precheck、開発用スクリプト、ハンドオーバー作成スクリプト
.github/         CI、Copilot のカスタマイズ、Issue / PR テンプレート
```

## Copilot のカスタマイズ

| ファイル | 用途 |
| --- | --- |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | リポジトリ全体のルール。回答・計画の言語、レイヤー構成、金額・時刻・エラーの扱い、検証コマンドを定義 |
| [.github/instructions/tests.instructions.md](.github/instructions/tests.instructions.md) | `**/*.test.ts` 向けの追加ルール。日本語のテスト名、固定時刻、API の検証、境界値、カバレッジ基準を定義 |
| [REVIEW.md](REVIEW.md) | コードレビューのチェックリスト。境界値、金額計算、エラーの伝え方、正常系・異常系のテスト、業務計算の配置を日本語で確認 |

## 発展課題（スタック PR）

本編で作った PR を、n 層の **スタック PR**（`gh stack`）に分けて出し直します。手順は [docs/01-exercise-guide.md](docs/01-exercise-guide.md#発展課題) を参照してください。

```text
(main) ← 1 層目 ← 2 層目 ← … ← n 層目
```

| 項目 | 内容 |
| --- | --- |
| 必要なもの | `gh stack` 拡張機能（`gh extension install github/gh-stack`） |
| 事前チェック | `npm run precheck -- --stretch`（`gh stack` も確認） |
| [.github/skills/gh-stack/SKILL.md](.github/skills/gh-stack/SKILL.md) | スタック PR を扱うエージェントスキル。`gh stack` の非対話操作、変更の配置、同期・マージの手順（github/gh-stack、MIT License） |
