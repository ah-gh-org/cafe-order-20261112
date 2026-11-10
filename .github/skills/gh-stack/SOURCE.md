# 出典

このフォルダーの `SKILL.md` と `references/` は、GitHub 公式の gh-stack エージェントスキルを改変せずに同梱したものです。

- リポジトリ: https://github.com/github/gh-stack
- パス: `skills/gh-stack`
- バージョン: `v0.1.1`（コミット `2bd699a544a09cb5c45a013d03416e0894b0454e`）
- ライセンス: MIT License（Copyright GitHub, Inc.）— 全文は同じフォルダーの [LICENSE](./LICENSE) を参照

Copilot のエージェントモードが `gh stack` を実行するときに、対話 UI を開かないフラグ（`--auto`、`--json`、`--yes` など）を使うためのスキルです。

更新するときは、同じパスの新しいリリースの内容で置き換えてください。

```bash
gh api "repos/github/gh-stack/contents/skills/gh-stack/SKILL.md?ref=<tag>" --jq .content | base64 -d > .github/skills/gh-stack/SKILL.md
```
