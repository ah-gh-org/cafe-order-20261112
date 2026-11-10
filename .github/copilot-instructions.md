# Copilot 向けリポジトリガイド（Bean & Byte Café 注文アプリ）

GitHub Copilot ハンズオン用の小さなカフェ注文アプリです。Node.js 24 + Express 5 + TypeScript（strict）で、DB はなくデータはすべてメモリ上にあります。画面もフレームワークを使わない TypeScript です。

## 言語

- 回答・計画は **日本語** で書く。
- コードの識別子、API のフィールド名、エラーコード、コミットメッセージは **英語**。
- 画面に表示する文言は日本語。

## アーキテクチャ

| レイヤー | 場所 | 役割 |
| --- | --- | --- |
| domain | `src/domain/` | 型と小さな値ロジック（`Product`、`Order`、`Yen`、`Clock`）。他のレイヤーに依存しない |
| repositories | `src/repositories/` | インメモリの保存とシードデータ。返す値はコピーにする |
| services | `src/services/` | 業務ロジック。`pricing.ts` は I/O のない純粋関数だけ |
| http | `src/http/` | `AppError`、エラーハンドラー、zod によるリクエスト検証（`parseRequest`） |
| routes | `src/routes/` | Express のルーター。検証 → service 呼び出し → レスポンス整形だけを行う |
| web | `src/web/`、`public/` | ブラウザ側。`view.ts`（HTML 文字列を返す純粋関数）、`cart.ts`、`api.ts`、`messages.ts`、`main.ts`（DOM のつなぎ込み） |
| 組み立て | `src/app.ts`、`src/server.ts` | `createApp({ clock, repositories })` で依存を注入。`server.ts` は起動だけ |

- 依存の向きは `routes → services → repositories → domain`。domain と services は Express を import しない（`AppError` は `src/http/errors.ts` から import してよい）。
- API のエラーは `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": {} } }` の形で、400 / 404 / 500 を返す。
- テスト用のアプリは `createTestApp(now)`（`src/testing/testApp.ts`）で作る。

## コマンド

| 目的 | コマンド |
| --- | --- |
| 開発サーバー（API + 画面、http://localhost:3000） | `npm run dev` |
| 開発サーバーの停止 | `npm run stop` |
| テスト | `npm test` |
| テスト + カバレッジ（80% 未満で失敗） | `npm run test:coverage` |
| Lint | `npm run lint` |
| 型チェック | `npm run typecheck` |
| ビルド | `npm run build` |

変更を終える前に `npm run lint`、`npm run typecheck`、`npm test` がすべて通ることを確認する。

## コーディングのルール

- 金額は円の整数（`Yen`）で扱い、浮動小数点の金額を作らない。割合の計算などで端数が出るときは、`Math.floor` などで丸め方を明示し、テストで確認する。
- 入力の検証はルートの境界で zod を使って 1 回だけ行う。services には検証済みの値を渡す。
- 業務ロジックは services の純粋関数に置く。ルーターや `main.ts` に計算を書かない。
- 現在時刻は注入された `Clock` から取る。`Date.now()` や引数なしの `new Date()` を業務ロジックで使わない。
- エラーは `AppError(status, code, message, details)` を throw する。`code` は `UPPER_SNAKE_CASE` で、`src/http/errors.ts` の `ErrorCode` に追加する。画面側の `src/web/messages.ts` にも日本語メッセージを追加する。
- 画面でサーバーやユーザー入力由来の文字列を HTML に入れるときは、必ず `escapeHtml` を通す。
- 画面の金額は `formatYen` で表示する。注文後の小計・合計などはブラウザで再計算せず、サーバーのレスポンスの値を表示する。
- 振る舞いを変えたら必ずテストを追加・更新する。境界値（ちょうど・1 つ手前・1 つ後）を含める。
- 変更は小さく、依頼された範囲に絞る。依頼されていないリファクタリングや依存パッケージの追加はしない。

## PR

- PR の説明は `.github/pull_request_template.md` に沿って日本語で書く。「テスト」には追加したテストの要点とコマンドの結果を、「カバレッジ」には `node scripts/coverage-summary.mjs` の出力を貼る。
- 「マージの影響範囲」には、マージしたときに影響が及ぶ範囲の大きさを「小・中・大」で書き、壊れうるもの（API の利用側、画面の表示、金額計算、既存のテストなど）を箇条書きで挙げる。diff だけでなく関連 Issue の内容も踏まえて判断する。
- 画面を変更した、またはスクリーンショットを撮った場合は、画像を GitHub にアップロードして PR 説明の「スクリーンショット」に埋め込む。画像がない場合だけ「なし」と書く。
