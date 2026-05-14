# Phase 6 — 광고 통합

**상태**: 🟨 코드 구현 완료, **토스앱 QR 빌드에서 실기 검증 필요** (광고 ID 발급 후)
**선행**: Phase 3, Phase 4
**후행**: Phase 8

## 목표

앱인토스 인앱 광고 2.0 ver2 SDK를 붙여 배너 광고를 주요 화면에 노출하고, 리워드 광고 시청 후 AI 호출 플로우를 완성한다. 토스 픽셀로 전환 추적까지 연결한다. 전면 광고는 선택.

## 참고 문서

- 광고 개요: [docs/ait-ads.md](../../docs/ait-ads.md)
- 배너 (WebView): [docs/ait-ads-banner.md](../../docs/ait-ads-banner.md)
- 토스 픽셀: [docs/ait-ads-pixels.md](../../docs/ait-ads-pixels.md)
- 명세: AD-001, AD-002, AD-003, FR-007, FR-010, FR-011, UI-003

## 핵심 제약

- ⚠️ **샌드박스는 인앱 광고 미지원** — 모든 광고 테스트는 토스앱 + QR 빌드로 진행 (Phase 1의 식별키 테스트와 동일 조건).
- **최소 토스앱 버전 5.241.0** — `getTossAppVersion`으로 가드, 미달 시 광고 영역 숨김.
- **테스트 광고 단위 ID** 사용 (`ait-ad-test-banner-id`, `ait-ad-test-rewarded-id`, `ait-ad-test-interstitial-id`). 실 단위 ID는 콘솔 등록 + 검수 후.
- 광고 정책 위반 금지: 클릭 보상 카피 금지, 리스킨 금지, 자동 새로고침 해킹 금지, ATF 첫 화면 전면광고 금지, 결제/인증 중 광고 금지.

## 작업 체크리스트

### 사전 설정
- [ ] 앱인토스 콘솔에서 광고 단위 등록 — 리워드 1, 배너 1 — **사용자 직접 진행**
- [x] 광고 ID 환경변수 분리: `VITE_AIT_BANNER_AD_GROUP_ID`, `VITE_AIT_REWARDED_AD_GROUP_ID` (테스트 ID 기본값으로 `.env`에 설정)
- [x] `granite.config.ts`의 `permissions`는 광고 관련 추가 권한 불필요 (현재 SDK는 in-app)
- [ ] 토스 픽셀 도입은 출시 후 별도 작업 — MVP 범위 외로 결정

### SDK 초기화 (`useTossAds`)
- [x] `useTossAds` 훅에서 모듈 싱글톤으로 `TossAds.initialize()` 1회만 호출
- [x] `TossAds.initialize.isSupported()` 가드 → 미지원 시 `status: "unsupported"`
- [x] `onInitialized` / `onInitializationFailed` 처리 → 실패 시 광고 영역 hide
- [x] 컴포넌트에서 `status: "loading" | "ready" | "unsupported" | "failed"` 구독

### 배너 광고 (AD-001 / FR-010)
- [x] `AdBanner` 컴포넌트 (`src/components/AdBanner.tsx`) — `TossAds.attachBanner` 사용
  - `theme: 'auto'`, `tone: 'grey'`, `variant: 'expanded'`, height 96px
  - 콜백: `onAdRendered`, `onAdImpression`, `onAdClicked`, `onNoFill`, `onAdFailedToRender` — dev log
  - cleanup: `attached?.destroy()` on unmount
- [x] 3개 화면 적용: Home, FeatureInput, Result 하단
- [x] SDK `unsupported / failed` 시 컴포넌트 자체가 `null` 반환 → 레이아웃 점프 없이 hide

### 리워드 광고 플로우 (FR-007 / AD-002)
- [x] `useRewardedAd` 훅 (`src/hooks/useRewardedAd.ts`) — `loadFullScreenAd` → `showFullScreenAd`
  - resolve `{ ok: true }`: `userEarnedReward` 이벤트 수신
  - resolve `{ ok: false, reason }`: `dismissed` / `failedToShow` / `unsupported` / `no-id`
  - 동시 호출 방어 (`inFlight` ref)
- [x] `AdGateScreen` 작성 — FR-007 안내 문구 반영
- [x] `useAskAI`가 `AD_REQUIRED` 에러를 받으면 `App.tsx`에서 `AdGate`로 전이 (`pendingParams` 보존)
- [x] AdGate "광고 보고 답변 받기" 클릭 흐름:
  1. `crypto.randomUUID()` 로 nonce 생성
  2. `useRewardedAd().showAd()` 호출
  3. `userEarnedReward` → `POST /functions/v1/ad-reward` 호출 (deviceId + nonce)
  4. `rewardId` 받으면 `App.handleRewardIssued`로 `ai-chat` 재호출
- [x] 광고 중단/실패 시 AdGate 유지 + 토스트 안내, AI 호출 진행 안 함
- [x] 광고 중복 노출 방지 — `inFlight` ref + `busy` state

### 전면 광고 (FR-011 / AD-003) — 선택, MVP 제외
- [ ] MVP 범위 외 — 출시 후 검토. 같은 `loadFullScreenAd/showFullScreenAd` API라 후속 작업은 작음.

### 토스 픽셀 (전환 추적) — MVP 제외
- [ ] MVP 범위 외 — 출시 후 검토.

### 안정성 / 로깅
- [x] 모든 광고 콜백에 `console.log` (`[Ad] ...` 프리픽스)
- [x] 광고 SDK가 토스앱 외 환경에서 실패해도 앱 깨지지 않음 — `useTossAds`가 try/catch로 SDK 호출 실패 시 `unsupported`로 폴백

## 완료 기준

- [ ] 토스앱 QR 빌드에서 홈/입력/결과 3화면에 배너 광고 노출 확인 — **Phase 8 QA**
- [ ] 무료 횟수 소진 → AdGate → 광고 시청 → AI 답변 성공 — **Phase 8 QA**
- [ ] 광고 중단 시 AI 호출 안 됨 + 안내 메시지 — 코드 로직 OK, 실기 검증 필요
- [x] 같은 rewardId 재사용 차단 (Phase 3 기능 확인 완료)
- [x] 토스앱 5.240.x 이하에서 광고 영역이 깨지지 않고 hide — `useTossAds` `unsupported` 분기
- [ ] 토스 픽셀 — MVP 범위 외
- [x] 광고 실패 / no-fill 상황에서 앱 크래시 없음 — `useRewardedAd`가 Promise 단일 resolve로 안전

## 결정 로그

- 광고 단위 ID: `.env`의 `VITE_AIT_BANNER_AD_GROUP_ID` / `VITE_AIT_REWARDED_AD_GROUP_ID`. 출시 전 실제 ID로 교체.
- nonce 저장: **메모리만** — `AdGateScreen.handleWatchAd` 내 지역 변수. sessionStorage 미사용 (네트워크 단절 시 광고 재시청 강제, 위변조 우려 회피).
- 리워드 광고 preload: 별도 prefetch 없이 `showAd` 호출 시점에 `loadFullScreenAd`. UX 개선이 필요하면 quota 임박 시 미리 load하도록 확장 가능.
- 전면 광고 / 토스 픽셀: **MVP 제외**. 출시 후 사용량/광고 수익 데이터를 보고 도입 여부 결정.
