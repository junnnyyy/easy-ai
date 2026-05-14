# Phase 1 — Foundation

**상태**: ✅ 완료
**선행**: 없음
**후행**: Phase 2, 3

## 목표

백엔드/DB/식별값/환경설정의 기반을 마련해서 이후 모든 phase가 동일한 토대 위에서 작업할 수 있게 한다.

## 산출물

- Supabase 프로젝트 (dev / prod 분리 정책 결정 포함)
- 5개 테이블 마이그레이션
- **토스 유저 식별키(`getAnonymousKey`)** 기반 사용자 식별 코드
- `.env` / Supabase Secrets 정리
- Edge Functions 디렉토리 구조

## 사용자 식별 전략

요구사항 명세에서는 `device_id`라는 용어를 쓰지만, 실제로는 앱인토스가 제공하는 **유저 식별키(User Hash Key)** 를 사용한다. (문서: [docs/유저식별.md](../../docs/유저식별.md))

본 서비스는 **비로그인·비게임 미니앱**이므로 `getAnonymousKey()`를 호출한다.

### 핵심 특성
- **클라이언트에서 해시값 직접 반환** — 서버 연동 없이 즉시 발급.
- **미니앱별로 고유** — 같은 토스 유저라도 다른 미니앱에서는 다른 키. `easy-ai`에서만 유효.
- **내부 식별용 전용** — 이 키로 토스 서버에 직접 요청 불가.
- **SDK 2.4.5+ 필요** — 현재 프로젝트는 `@apps-in-toss/web-framework@^2.5.1`이므로 OK.
- ⚠️ **샌드박스에서는 mock 데이터** — 실제 테스트는 QR 코드로 토스앱에서 진행해야 함.
- 비게임 미니앱에서만 동작, 게임 카테고리에서 호출 시 에러.

### DB / API 매핑
- 명세의 `device_id` 컬럼/필드는 **이름만 유지**하고 값으로 `anonymousKey`를 채워 넣는다 (스키마 변경 불필요).
- 일관성 위해 클라이언트 코드 내부 변수명은 `userKey` 같은 의미 있는 이름을 쓰고, API 송수신 시점에 `deviceId` 키로 직렬화. 예:
  ```ts
  const userKey = await getAnonymousKey();
  await aiChat({ deviceId: userKey, ... });
  ```
- 토스 로그인 도입 시 마이그레이션 경로 있음 — MVP에서는 무시.

## 작업 체크리스트

### Supabase 프로젝트
- [x] Supabase 프로젝트 생성 — `easy-ai` / `gwwrlzxkubirqnervnwy` / Northeast Asia (Seoul)
- [x] 로컬 개발용 `supabase` CLI 설치 및 `supabase init` 실행
- [x] `supabase/` 디렉토리를 레포에 커밋 (functions, migrations 포함)
- [x] dev/prod 환경 분리 방식 결정 — **MVP는 단일 프로젝트**, RLS + service_role 분리로 충분. 트래픽 증가 시 별도 프로젝트 분리 검토.

### DB 스키마 (명세 10장)
- [x] `ai_requests` 테이블 생성 (DB-001)
- [x] `usage_limits` 테이블 생성 + `(device_id, usage_date)` unique 인덱스 (DB-002)
- [x] `ad_rewards` 테이블 생성 (DB-003)
- [x] `prompt_templates` 테이블 생성 + 4종 시드 데이터 (DB-004, 명세 11장)
- [x] `blocked_inputs` 테이블 생성 (DB-005)
- [x] RLS 정책 — Edge Function service_role 외 접근 차단

### 시드 데이터 (`prompt_templates`)
- [x] `free_chat` 프롬프트 (PR-002)
- [x] `explain_easy` 프롬프트 (PR-003)
- [x] `spam_check` 프롬프트 (PR-004)
- [x] `rewrite_message` 프롬프트 (PR-005)
- [x] 공통 시스템 프롬프트 저장 방식 결정 — `system_prompt` 컬럼에 PR-001 공통 + 기능별 system을 합쳐서 저장

### 환경 변수 / Secrets
- [x] `OPENAI_API_KEY` Supabase Secrets에 저장 (NFR-001-02)
- [x] `SUPABASE_URL`, `SUPABASE_ANON_KEY` 프론트 `.env`에 실제 값 입력 완료
- [x] `SUPABASE_SERVICE_ROLE_KEY` — Edge Function 런타임에 Supabase가 자동 주입하므로 별도 설정 불필요
- [x] `.env.example` 파일 생성 + `.gitignore` 점검

### 클라이언트 유저 식별키 (WV-002 / 위 "사용자 식별 전략" 참조)
- [x] 앱인토스 SDK `getAnonymousKey()` 호출 코드 작성
- [x] 반환값이 `undefined`인 경우 처리 — 구버전 토스앱이거나 게임 카테고리에서 잘못 호출됐을 때
- [x] 첫 호출 결과를 메모리 캐시 (`useUserKey` 훅, Promise singleton)
- [x] 샌드박스에서는 mock 키가 내려오므로, 운영 테스트는 QR 빌드로만 가능하다는 점을 기록 (아래 "결정 로그" 참고)
- [x] HTTP 클라이언트가 모든 API 호출에 `deviceId: userKey`를 자동 포함하도록 구성
- [x] 키 발급 실패 시 폴백 정책 결정 — 키 없으면 AI 호출 자체 차단 + 안내 (`status: "error"` 상태)

### Edge Functions 코드
- [x] `supabase/functions/_shared/cors.ts` — CORS 헤더 + 응답 헬퍼
- [x] `supabase/functions/_shared/supabase.ts` — service_role 클라이언트
- [x] `supabase/functions/_shared/rate-limit.ts` — 사용량 체크/증가 (FREE 3회/일, AD 10회/일)
- [x] `supabase/functions/ai-chat/index.ts` — AI 호출 (사용량 제한·광고보상 검증·OpenAI·로그 포함)
- [x] `supabase/functions/ad-reward/index.ts` — 광고 보상 발급 (30분 TTL)
- [x] `supabase/migrations/20260514000003_increment_usage_fn.sql` — 원자적 카운터 증가 RPC

### 프로젝트 구조
- [x] `src/api/` — Edge Function 호출 모듈
- [x] `src/hooks/` — `useUserKey` 등 공용 훅
- [x] `src/features/` — 기능형 질문 화면들
- [x] `src/screens/` — 화면 컴포넌트 디렉토리
- [x] `supabase/functions/_shared/` — 함수 공통 유틸 디렉토리

## 완료 기준

- [x] 마이그레이션 파일 3개 레포에 존재 (테이블 5개, 시드 4종, increment_usage RPC)
- [x] `prompt_templates` 시드 SQL 완료
- [x] Supabase 프로젝트에 마이그레이션 실제 적용 (`supabase db push`) — 3개 마이그레이션 모두 적용 완료
- [ ] 토스앱(QR 빌드)에서 프론트가 `getAnonymousKey` 응답을 받아 `console.log` 가능하다. (샌드박스 mock 값과 다름) — Phase 8 QA에서 검증
- [x] OpenAI key가 클라이언트 번들에 포함되지 않는다 — Edge Function 내부의 `Deno.env.get("OPENAI_API_KEY")`로만 접근.

## 결정 로그

- 공통 시스템 프롬프트(PR-001)를 별도 row 대신 `system_prompt` 컬럼에 기능별 prompt와 합쳐서 저장 — Edge Function에서 조회 1회로 끝나 단순함.
- 유저 키 없음 시 폴백: `useUserKey`가 `status: "error"`를 반환하고, 화면에서 AI 호출 자체를 차단 + 안내 문구 표시.
- Supabase 프로젝트 생성 및 `.env` 실제 값 입력은 사용자가 직접 진행 필요.
- `getAnonymousKey`는 샌드박스에서 mock 값을 반환한다. DB에 기록된 `device_id` 값이 실제 사용자와 다를 수 있으므로, **운영 확인은 반드시 토스앱 QR 빌드(`npm run dev` → 토스 샌드박스앱 QR 스캔)로 진행**해야 한다.
- 무료 사용 한도: **하루 3회 무료, 광고 포함 최대 10회**. 상수는 `_shared/rate-limit.ts`의 `FREE_DAILY_LIMIT`, `AD_DAILY_LIMIT`에서 조정.
- `SUPABASE_SERVICE_ROLE_KEY`는 Supabase Edge Function 런타임이 자동으로 주입하므로 Secrets 별도 등록 불필요. `OPENAI_API_KEY`만 수동 등록 필요.
