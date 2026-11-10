---
applyTo: "**/*.test.ts"
description: テストコード（Vitest）の書き方
---

# テストの書き方

- Vitest の `describe` / `it` / `expect` を使う。テスト名は日本語で「条件 → 結果」がわかるように書く。
- テストファイルは対象と同じフォルダーに `<対象>.test.ts` として置く。
- 時刻は固定する。ユニットテストは `fixedClock(...)`、API テストは `createTestApp(now)` を使い、実行日に結果が左右されないようにする。
- API テストは supertest と `createTestApp()`（`src/testing/testApp.ts`）を使う。ステータスコードとレスポンスボディを確認し、エラーのときは `error.code` と `error.details` も確認する。
- エラーになるリクエストでは、データが保存・更新されていないこと（`createTestApp()` が返す `repositories` で確認）も確認する。
- 境界値（ちょうど・1 つ手前・1 つ後）を必ず入れる。同じ形のケースは `it.each` でまとめる。
- 期待値は実装と同じ計算式ではなく、具体的な値（例: `toBe(1450)`）で書く。
- 純粋関数は直接呼んでテストする。モックは外部との境界（`fetch` など）だけにする。
- `src/web` のテストは Node 環境で動かす。DOM を使うテストは書かず、`view.ts` などの純粋関数をテストする。
- `npm run test:coverage` のカバレッジ（行・分岐・関数・文すべて 80% 以上）を下回らないようにする。
