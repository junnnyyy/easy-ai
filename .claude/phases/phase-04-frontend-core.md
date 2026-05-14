# Phase 4 — Frontend Core (홈 / 자유질문 / 결과)

**상태**: ✅ 완료 (광고 시청 실연결은 Phase 6에서)
**선행**: Phase 1, Phase 2 (free_chat 동작 필요)
**후행**: Phase 5, 6, 7

## 목표

기본 사용자 흐름(홈 진입 → 자유 질문 입력 → 결과 화면)을 TDS Mobile로 완성한다. 광고는 Phase 6에서 붙이므로 이번 phase는 광고 자리만 placeholder로 둔다.

## 관련 요구사항

FR-001, FR-002, FR-008, FR-009, NFR-002, NFR-003, NFR-005, UI-001, UI-004, UI-005

## 작업 체크리스트

### 라우팅 / 화면 구조
- [x] 4개 화면: `Home`, `FeatureInput`, `AdGate`(Phase 6 SDK 연결 대기), `Result`
- [x] 라우팅 — `App.tsx`의 React state machine
- [ ] 뒤로가기 동작 (WV-001-04) — `useBackEvent`는 RN 전용이라 WebView에서 사용 불가. 토스앱 셸이 시스템 뒤로가기를 자체 처리. Phase 8 QA에서 QR 빌드로 실기 검증.

### API 클라이언트 (`src/api/`)
- [x] `aiChat({ deviceId, requestType, message, tone?, rewardId? })`
- [x] 공통 fetch 래퍼 — Supabase URL/anon key 포함, 에러 코드 파싱
- [x] 응답 타입 정의 (TS)

### 훅
- [x] `useUserKey()` — Phase 1에서 만든 것 재사용
- [x] `useAskAI()` — mutation 형태, `loading / error / data` 노출
  - [x] 중복 클릭 방어 (`inFlight` ref)
  - [x] 10초 타임아웃 (`AbortController`) → `CLIENT_TIMEOUT`
  - [x] 에러 코드/메시지 동시 노출 (`AskError = { code, message }`)

### Home 화면 (UI-001 / FR-001)
- [x] 서비스명 헤더
- [x] 메인 안내 문구: "어려운 말도 쉽게, / 궁금한 것도 바로 물어보세요."
- [x] `TextArea`로 자유 질문 입력창 + 글자 카운터
- [x] `FixedBottomCTA + Button(xlarge)` — "AI에게 물어보기"
- [x] 기능 카드 3종 (`FEATURE_CONFIGS`) → `FeatureInputScreen` 라우팅
- [x] 개인정보 주의 문구
- [x] 하단 배너 광고 placeholder (`BannerPlaceholder`)

### 입력 검증 (FR-002-04, 05)
- [x] 빈 입력 → 인라인 오류 메시지
- [x] 1000자 초과 → 안내 + 버튼 disabled
- [x] 폼 클라이언트 검증 후 서버 호출

### Result 화면 (UI-004 / FR-008, FR-009)
- [x] 답변 본문 — fontSize 17, line-height 1.7, whitespace pre-wrap
- [x] 복사 버튼 → `navigator.clipboard.writeText`
- [x] 복사 성공/실패 토스트 (`useToast`)
- [x] "다시 질문하기" 버튼 → Home으로 이동
- [x] 하단 배너 광고 placeholder

### 로딩 화면 (UI-005)
- [x] AI 응답 대기 중 TDS `Loader` + "답변을 만들고 있어요."
- [x] 5초 이상 지연 시 추가 안내 ("조금만 더 기다려 주세요.")

### 오류 처리 (Phase 7과 연계)
- [x] `getErrorMessage(code)` 매핑 함수 — `useAskAI` 내부
- [x] 다루는 코드: `DAILY_LIMIT_EXCEEDED`, `BLOCKED_SENSITIVE_INPUT`, `AD_REQUIRED`, `AD_REWARD_INVALID`, `AI_TIMEOUT`, `AI_ERROR`, `INPUT_TOO_LONG`, `NETWORK_ERROR`, `CLIENT_TIMEOUT`, `USER_KEY_UNAVAILABLE`
- [x] `AD_REQUIRED`는 `App.tsx`에서 잡아 `AdGateScreen`으로 전이 (광고 SDK는 Phase 6에서 연결)

## 완료 기준

- [x] 홈 → 입력 → 결과 → 복사/다시질문이 매끄럽게 동작 (코드 흐름 확인)
- [x] 빈/긴 입력에 대한 안내가 표시된다
- [x] 로딩 상태가 시각적으로 명확 (`Loader` + 5초 후 추가 안내)
- [x] OpenAI key는 Edge Function 내부의 `Deno.env.get`로만 접근, 클라이언트 미노출
- [x] TDS v2 prop 규칙(`variant` / `size`) 사용 (`Button`, `TextArea`, `SegmentedControl` 등)

## 결정 로그

- 라우팅: react-router 도입 없이 React state machine (`Screen` 디스크리미네이티드 유니언) — MVP 화면 4종이라 충분, 번들 사이즈 절약.
- WebView 뒤로가기: `useBackEvent`(@granite-js/react-native)는 RN 측 훅이라 WebView에서 import 불가. 토스앱 셸이 시스템 뒤로가기를 자체 처리하므로 별도 가드 없이 진행, Phase 8 QA에서 검증.
- 광고 placeholder: 배너는 `BannerPlaceholder` 컴포넌트로 자리(높이 64)만 잡아 Phase 6 적용 시 레이아웃 점프 방지. AdGate는 화면 + 안내 텍스트만, 광고 시청 버튼은 토스트로 대체.
- 에러 시그니쳐: `useAskAI`의 `error`를 string에서 `{ code, message }` 객체로 승격 → `App`에서 `AD_REQUIRED`만 분기, 나머지는 자식 화면에서 메시지만 노출.
