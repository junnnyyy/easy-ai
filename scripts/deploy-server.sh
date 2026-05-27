#!/usr/bin/env bash
# 서버 배포: 마이그레이션(000016, 000017) 적용 + Edge Function(ai-chat, ad-reward) 배포.
# 배포 전에 현재(이전) 함수 코드를 스냅샷해 두어 rollback-server.sh로 되돌릴 수 있게 함.
set -euo pipefail
cd "$(dirname "$0")/.."

SNAP="scripts/.rollback-snapshot"
mkdir -p "$SNAP"

echo "▶ 롤백용 스냅샷 저장 (배포 직전의 원격 함수 = git HEAD 코드)"
git show HEAD:supabase/functions/ai-chat/index.ts  > "$SNAP/ai-chat.index.ts"
git show HEAD:supabase/functions/ad-reward/index.ts > "$SNAP/ad-reward.index.ts"
echo "  → $SNAP/ 에 저장됨"
echo

echo "▶ 대기 중인 마이그레이션 (Remote가 비어 있는 것만 적용됨)"
supabase migration list
echo

read -r -p "위 마이그레이션을 원격에 적용하고 함수를 배포할까요? [y/N] " ans
[[ "$ans" == "y" || "$ans" == "Y" ]] || { echo "취소됨."; exit 1; }

echo "▶ 마이그레이션 적용 (supabase db push)"
supabase db push

echo "▶ Edge Function 배포 (ai-chat, ad-reward)"
supabase functions deploy ai-chat ad-reward

echo
echo "✅ 배포 완료."
echo "   문제 발생 시 롤백:  scripts/rollback-server.sh"
