#!/usr/bin/env bash
# 서버 롤백: ai-chat / ad-reward를 배포 직전(이전) 코드로 재배포.
# 워킹트리의 신규 코드는 백업 후 그대로 복구하므로 git diff는 변하지 않음.
# (DB는 추가·하위호환이라 보통 되돌릴 필요 없음 — 필요 시 scripts/rollback.sql 참고)
set -euo pipefail
cd "$(dirname "$0")/.."

SNAP="scripts/.rollback-snapshot"
if [[ ! -f "$SNAP/ai-chat.index.ts" || ! -f "$SNAP/ad-reward.index.ts" ]]; then
  echo "❌ 스냅샷이 없어요 ($SNAP/). deploy-server.sh를 먼저 실행했어야 해요." >&2
  exit 1
fi

AI_CHAT="supabase/functions/ai-chat/index.ts"
AD_REWARD="supabase/functions/ad-reward/index.ts"
TMP="$(mktemp -d)"

echo "▶ 현재(신규) 함수 코드 백업 → $TMP"
cp "$AI_CHAT" "$TMP/ai-chat.index.ts"
cp "$AD_REWARD" "$TMP/ad-reward.index.ts"

# 성공/실패와 무관하게 워킹트리를 신규 코드로 되돌림
restore_new() {
  cp "$TMP/ai-chat.index.ts" "$AI_CHAT"
  cp "$TMP/ad-reward.index.ts" "$AD_REWARD"
  rm -rf "$TMP"
  echo "▶ 워킹트리를 신규 코드로 복구함 (git diff 변화 없음)"
}
trap restore_new EXIT

echo "▶ 이전 함수 코드로 교체"
cp "$SNAP/ai-chat.index.ts" "$AI_CHAT"
cp "$SNAP/ad-reward.index.ts" "$AD_REWARD"

read -r -p "이전 코드로 ai-chat, ad-reward를 재배포할까요? [y/N] " ans
[[ "$ans" == "y" || "$ans" == "Y" ]] || { echo "취소됨."; exit 1; }

echo "▶ Edge Function 재배포 (이전 코드)"
supabase functions deploy ai-chat ad-reward

echo
echo "✅ 함수 롤백 완료 (원격 = 이전 코드)."
echo "   DB는 그대로 둬도 됩니다. 완전히 되돌리려면:"
echo "     1) 위 함수 롤백을 먼저 한 뒤"
echo "     2) Supabase SQL Editor에서 scripts/rollback.sql 실행"
