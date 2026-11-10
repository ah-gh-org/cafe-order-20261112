#!/usr/bin/env bash
# 顧客の管理者に渡すハンドオーバー一式（zip）を作成する。
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRANCHES=(main solution/core solution/api solution/ui)
DATE="$(date +%Y%m%d)"
NAME="cafe-order-handover-${DATE}"
OUT_DIR="$REPO_ROOT/dist/handover"
DENYLIST=""
SKIP_FETCH=false

usage() {
  cat <<'EOF'
使い方: scripts/package-handover.sh [--denylist <file>] [--skip-fetch]

origin（GitHub）の main と solution/* ブランチから git バンドルを作り、
ドキュメントと一緒に zip にまとめます。

出力: dist/handover/cafe-order-handover-<yyyymmdd>.zip
  cafe-order-template.bundle  main と solution/* だけを含む git バンドル
  docs/                       ドキュメント一式（docs/admin/ を除く）
  SHA256SUMS                  各ファイルの SHA-256

作成前にシークレットスキャンを行い、見つかった場合は失敗します
（gitleaks があれば使い、なければパターン検索）。

オプション:
  --denylist <file>  含まれてはいけない語（1 行 1 語、大文字小文字を区別しない）の一覧。
                     履歴とファイルに見つかった場合は失敗します。一覧自体はリポジトリに入れないでください。
  --skip-fetch       git fetch origin を省略します。
  -h, --help         このヘルプを表示します。
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --denylist)
      [[ $# -ge 2 && -f "$2" ]] || {
        echo "❌ --denylist のファイルが見つかりません: ${2:-}" >&2
        exit 1
      }
      DENYLIST="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
      shift
      ;;
    --skip-fetch) SKIP_FETCH=true ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      echo "❌ 不明な引数です: $1" >&2
      exit 2
      ;;
  esac
  shift
done

for command in git zip; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "❌ ${command} が見つかりません。インストールしてから再実行してください。" >&2
    exit 1
  }
done

if command -v sha256sum >/dev/null 2>&1; then
  SHA256=(sha256sum)
else
  SHA256=(shasum -a 256)
fi

cd "$REPO_ROOT"

if [[ "$SKIP_FETCH" != true ]]; then
  echo "origin から最新を取得しています…"
  git fetch --quiet --prune origin
fi

for branch in "${BRANCHES[@]}"; do
  git rev-parse --verify --quiet "refs/remotes/origin/${branch}" >/dev/null || {
    echo "❌ origin/${branch} がありません。先にプッシュしてください。" >&2
    exit 1
  }
done

# テンプレートから作ったリポジトリでは各ブランチが別々の 1 コミットになるため、
# 追いつき用の差分（solution/* 同士の木の差分）が正しくなるよう、各レイヤーが 1 つ下に 1 コミットで積まれていることを確認する。
below="main"
for branch in "${BRANCHES[@]:1}"; do
  if [[ "$(git rev-parse "refs/remotes/origin/${branch}^")" != "$(git rev-parse "refs/remotes/origin/${below}")" ]]; then
    echo "❌ origin/${branch} が origin/${below} の上に 1 コミットで積まれていません。" >&2
    echo "   main を更新したら、solution/* を順に積み直してプッシュしてください（git rebase --onto など）。" >&2
    exit 1
  fi
  outside="$(git diff --name-only "refs/remotes/origin/${below}" "refs/remotes/origin/${branch}" | grep -v -E '^(src/|public/|requests\.http$)' || true)"
  if [[ -n "$outside" ]]; then
    echo "❌ origin/${branch} に演習の範囲外の変更があります:" >&2
    printf '   %s\n' $outside >&2
    exit 1
  fi
  below="$branch"
done

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

# 1. 必要なブランチだけを持つ一時リポジトリを作り、バンドルにする
MIRROR="$WORK_DIR/mirror.git"
git init --quiet --bare "$MIRROR"
refspecs=()
for branch in "${BRANCHES[@]}"; do
  refspecs+=("refs/remotes/origin/${branch}:refs/heads/${branch}")
done
git --git-dir="$MIRROR" fetch --quiet --no-tags "$REPO_ROOT" "${refspecs[@]}"
git --git-dir="$MIRROR" symbolic-ref HEAD refs/heads/main

STAGE="$WORK_DIR/$NAME"
mkdir -p "$STAGE"
git --git-dir="$MIRROR" bundle create --quiet "$STAGE/cafe-order-template.bundle" --all
git bundle verify "$STAGE/cafe-order-template.bundle" >/dev/null 2>&1 || {
  echo "❌ 作成したバンドルを検証できませんでした。" >&2
  exit 1
}

# 2. ドキュメント（origin/main の内容を使う。管理者向けの docs/admin/ は含めない）
git --git-dir="$MIRROR" archive --format=tar main docs | tar -x -C "$STAGE"
rm -rf "$STAGE/docs/admin"

# 3. シークレットスキャン（バンドルに入る全履歴と、同梱するファイル）
echo "シークレットスキャンを実行しています…"
FINDINGS="$WORK_DIR/findings.txt"
: >"$FINDINGS"
if command -v gitleaks >/dev/null 2>&1; then
  if gitleaks git --help >/dev/null 2>&1; then
    gitleaks git --no-banner --redact "$MIRROR" >>"$FINDINGS" 2>&1 || echo "gitleaks: 履歴に検出あり" >>"$FINDINGS"
    gitleaks dir --no-banner --redact "$STAGE" >>"$FINDINGS" 2>&1 || echo "gitleaks: ファイルに検出あり" >>"$FINDINGS"
  else
    gitleaks detect --no-banner --redact --source "$MIRROR" >>"$FINDINGS" 2>&1 || echo "gitleaks: 履歴に検出あり" >>"$FINDINGS"
    gitleaks detect --no-banner --redact --no-git --source "$STAGE" >>"$FINDINGS" 2>&1 ||
      echo "gitleaks: ファイルに検出あり" >>"$FINDINGS"
  fi
  grep -q '検出あり' "$FINDINGS" || : >"$FINDINGS"
  SCANNER="gitleaks"
else
  SCANNER="パターン検索（gitleaks が見つからないため）"
  PATTERN='(gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[abprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|sk-[A-Za-z0-9]{32,}|(password|passwd|secret|api[_-]?key|client[_-]?secret|access[_-]?token)["'"'"' ]*[:=] *["'"'"'][^"'"'"' ]{8,}["'"'"'])'
  git --git-dir="$MIRROR" log --all -p --no-color --format='commit %H' | grep -n -E -i "$PATTERN" >>"$FINDINGS" || true
  grep -r -n -E -i "$PATTERN" --exclude='*.bundle' "$STAGE" >>"$FINDINGS" || true
fi

if [[ -n "$DENYLIST" ]]; then
  echo "禁止語リストで確認しています…"
  WORDS="$WORK_DIR/denylist.txt"
  grep -v -E '^[[:space:]]*(#|$)' "$DENYLIST" | tr -d '\r' >"$WORDS" || true
  if [[ -s "$WORDS" ]]; then
    git --git-dir="$MIRROR" log --all -p --no-color --format='commit %H %an %ae %s' | grep -n -i -F -f "$WORDS" >>"$FINDINGS" || true
    git --git-dir="$MIRROR" for-each-ref --format='%(refname)' | grep -i -F -f "$WORDS" >>"$FINDINGS" || true
    grep -r -n -i -F -f "$WORDS" --exclude='*.bundle' "$STAGE" >>"$FINDINGS" || true
    (cd "$STAGE" && find . -type f | grep -i -F -f "$WORDS") >>"$FINDINGS" || true
  fi
fi

if [[ -s "$FINDINGS" ]]; then
  echo "❌ スキャンで問題が見つかりました（${SCANNER}）。内容を確認し、履歴から取り除いてから再実行してください:" >&2
  head -n 40 "$FINDINGS" >&2
  exit 1
fi
echo "✅ シークレットスキャン: 問題なし（${SCANNER}）"

# 4. チェックサムと zip
(cd "$STAGE" && find . -type f ! -name SHA256SUMS | LC_ALL=C sort | sed 's|^\./||' | while IFS= read -r file; do
  "${SHA256[@]}" "$file"
done >SHA256SUMS)

mkdir -p "$OUT_DIR"
ZIP="$OUT_DIR/${NAME}.zip"
rm -f "$ZIP"
(cd "$WORK_DIR" && zip -q -r -X "$ZIP" "$NAME" -x '*.DS_Store')

echo ""
echo "✅ ハンドオーバー一式を作成しました: ${ZIP}"
echo "   サイズ: $(du -h "$ZIP" | cut -f1)"
echo "   SHA-256: $("${SHA256[@]}" "$ZIP" | cut -d' ' -f1)"
echo "   バンドルのブランチ:"
git --git-dir="$MIRROR" for-each-ref --format='     %(refname:short)  %(objectname:short)  %(subject)' refs/heads
