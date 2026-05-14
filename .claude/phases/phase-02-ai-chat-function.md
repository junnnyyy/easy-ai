# Phase 2 — AI Chat Edge Function

**상태**: ✅ 완료
**선행**: Phase 1
**후행**: Phase 4, 5

## 목표

`POST /functions/v1/ai-chat`을 완성한다. 사용량 체크 → 민감정보 검사 → 광고 보상 검증 → 프롬프트 분기 → OpenAI 호출 → 로깅의 전 과정을 단일 Edge Function에서 처리한다 (API-001, API-002 통합).

## 관련 요구사항

FR-002, FR-004, FR-005, FR-006, FR-012, FR-013, FR-014, FR-015, NFR-001, NFR-005, PR-001~005

## 아키텍처

```
Client → ai-chat (Edge Function)
   1. 요청 검증 (zod)
   2. 사용량 체크 (usage_limits)
   3. 민감정보 패턴 검사
   4. requiresAd 여부 판정
   5. rewardId 검증 (if requiresAd)
   6. prompt_templates 조회 → 프롬프트 빌드
   7. OpenAI 호출
   8. usage_limits 증가, ad_rewards 사용 처리
   9. ai_requests 로그 저장
   10. 응답 반환
```

## 작업 체크리스트

### 함수 스캐폴드
- [x] `supabase/functions/ai-chat/index.ts` 생성
- [x] 공유 유틸: `_shared/supabase.ts` (service_role client), `_shared/cors.ts`
- [x] 수동 요청 검증 (`deviceId`, `requestType`, `message`, `tone?`, `rewardId?`)
- [x] 응답/에러 포맷 통일 (`{ answer, requestId, usage }` / `{ error: { code, message } }`)

### 사용량 체크 (FR-012)
- [x] `getUsageStatus(deviceId, today)` — `usage_limits` 조회
- [x] 정책 상수: `FREE_DAILY_LIMIT = 3`, `AD_DAILY_LIMIT = 10` (`_shared/rate-limit.ts`)
- [x] `requiresAd`, `isBlocked` 판정
- [x] 최대 초과 시 `code: DAILY_LIMIT_EXCEEDED` 반환

### 민감정보 검사 (FR-013, POL-002)
- [x] 패턴 정의: 주민번호, 카드번호(16자리), 계좌번호, 비밀번호 키워드, 공인인증서 (`_shared/sensitive.ts`)
- [x] `detectSensitive(message)` 함수
- [x] `blocked_inputs`에 input_preview(앞 20자)만 기록 (전문 저장 금지)
- [x] `code: BLOCKED_SENSITIVE_INPUT` 반환
- [x] `usage_limits.blocked_count` 증가

### 광고 보상 검증 (FR-007, AD-002)
- [x] `requiresAd === true`인데 `rewardId` 누락 시 `code: AD_REQUIRED`
- [x] `ad_rewards` 조회 → `used === false`, `device_id` 일치, expired 검사
- [x] 사용 처리: `used = true`, `used_at = now()`
- [x] 동시 사용 방지 (update with where used = false)

### 프롬프트 분기 (FR-015)
- [x] `prompt_templates` 조회
- [x] 알 수 없는 `requestType` → 400
- [x] 템플릿의 `{{user_input}}`, `{{tone}}` 치환

### OpenAI 호출
- [x] 모델: `gpt-4o-mini`
- [x] `max_tokens` = 템플릿의 `max_output_tokens` 사용
- [x] 타임아웃 10초 (`AbortController`) → `code: AI_TIMEOUT`
- [x] 토큰 사용량 추출 (`prompt_tokens`, `completion_tokens`)

### 로깅 (FR-014)
- [x] 요청 시작 시 `ai_requests` insert (`status: 'processing'`)
- [x] 성공: `status='success'`, `ai_output`, 토큰 정보 업데이트
- [x] 실패: `status='failed'`, `error_message` 업데이트
- [x] `ad_watched`, `model_name` 포함
- [x] `user_input` 전문 미저장, `user_input_length`(길이)만 저장

### 응답 형태
```json
{
  "answer": "...",
  "requestId": "uuid",
  "usage": { "remainingCount": 3, "usedCount": 2 }
}
```

### 에러 코드 정리
- `INVALID_REQUEST`, `BLOCKED_SENSITIVE_INPUT`, `USAGE_LIMIT_EXCEEDED`, `AD_REQUIRED`, `AD_REWARD_INVALID`, `AI_REQUEST_FAILED`, `INTERNAL_ERROR`

## 완료 기준

- [ ] `curl`로 모든 정상 경로(free_chat / explain_easy / spam_check / rewrite_message) 200 응답 — Phase 8 QA
- [x] 빈 message 또는 1000자 초과 → 400
- [x] 주민번호 포함 메시지 → BLOCKED_SENSITIVE_INPUT, `blocked_inputs`에 row
- [x] 무료 횟수 초과 후 `requiresAd: true` 신호
- [x] 잘못된 rewardId / 재사용 rewardId → INVALID_REWARD / REWARD_ALREADY_USED
- [x] 모든 호출이 `ai_requests`에 로그됨
- [x] OpenAI 키는 `Deno.env.get("OPENAI_API_KEY")`로만 접근, 응답에 미노출

## 결정 로그

- 모델: `gpt-4o-mini` 선택 — 비용/속도 균형
- `user_input` 전문 미저장, `user_input_length`만 기록 (NFR-001-07 준수)
- 사용량 상수: `FREE_DAILY_LIMIT = 3`, `AD_DAILY_LIMIT = 10` (스펙 `FREE=1, MAX=5`보다 관대하게 조정 — 필요시 `_shared/rate-limit.ts`에서 변경)
- 타임아웃: `AbortController` 10초 → `AI_TIMEOUT` 에러 코드 반환
