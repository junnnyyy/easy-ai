# easy-ai

앱인토스(Apps in Toss) WebView 미니앱이에요. React + Vite + TypeScript로 개발하고, UI는 TDS Mobile을 사용해요.

## 아키텍처

- **프론트**: Vite + React (이 레포)
- **앱 셸**: Android / iOS WebView 래퍼 (앱인토스 미니앱으로 호스팅)
- **백엔드**: Supabase Edge Functions
- **DB**: Supabase PostgreSQL
- **사용량 제한**: Supabase DB (rate limit / quota를 DB 테이블로 관리)
- **AI 호출**: 클라이언트 → Supabase Edge Function → OpenAI (API 키는 Edge Function에만 둠. 클라이언트에 절대 노출하지 말 것)
- **광고**: 앱인토스 인앱 광고 SDK

## 기술 스택

- **런타임/플랫폼**: 앱인토스 WebView (`@apps-in-toss/web-framework`)
- **빌드**: Vite + Granite CLI (`granite dev`, `ait build`, `ait deploy`)
- **프레임워크**: React 18 + TypeScript
- **UI**: `@toss/tds-mobile` v2 + `@toss/tds-mobile-ait`
- **스타일**: `@emotion/react`, `@toss/tds-colors`
- **백엔드 SDK**: `@supabase/supabase-js` (예정)

## 프로젝트 구조

- `src/main.tsx` — 진입점. `TDSMobileAITProvider`로 앱을 감싸고 `granite.config.ts`의 `brand.primaryColor`를 주입해요.
- `src/App.tsx` — 루트 화면.
- `granite.config.ts` — 앱인토스 앱 메타(`appName`, `brand`, `permissions`), 로컬 dev 서버 설정.
- `vite.config.ts` — Vite 설정.
- `docs/skills/` — 앱인토스 / TDS Mobile 레퍼런스 (위에서 import).

## 개발 명령어

```bash
npm run dev      # granite dev — 토스 샌드박스앱과 연결되는 dev 서버
npm run build    # ait build
npm run deploy   # ait deploy (콘솔 API 키 필요)
npm run lint
npm run format
```

## 작업 규칙

### TDS Mobile 사용
- UI 컴포넌트는 가능한 한 `@toss/tds-mobile`에서 가져와서 써요. raw `<div>` + 인라인 스타일로 동일한 것을 새로 만들지 말기.
- TDS v2 기준 prop을 사용해요 (`color`, `variant`, `size`). `type`/`style`/`htmlType`/`htmlStyle` 같은 v1 prop은 쓰지 않아요.
- 색상은 `@toss/tds-colors`의 `colors` / `adaptive`를 사용해 하드코딩을 피해요.
- 오버레이(Dialog, Toast, BottomSheet)는 `useDialog` / `useToast` / `useBottomSheet` 훅으로 호출해요.

### 앱인토스 SDK
- 네이티브 기능(공유, 결제, 로그인, 권한, 위치 등)은 `@apps-in-toss/web-framework`의 API를 사용해요. 자체 구현 금지.
- 새로 권한이 필요한 API를 쓰면 `granite.config.ts`의 `permissions`에 추가해요.
- 브라우저에서 잘 동작해도 토스앱/샌드박스에서 검증이 필요한 API가 많아요. 결제·로그인 같은 핵심 기능을 만들면 실제 동작 확인이 필요하다고 사용자에게 알려주세요.

### Supabase / 백엔드
- OpenAI 호출은 반드시 Edge Function을 경유해요. 클라이언트에서 OpenAI API를 직접 부르거나 키를 노출하지 않기.
- 모든 AI 호출 전에 Edge Function에서 Supabase DB의 사용량 제한(quota/rate limit)을 확인하고, 호출 후 카운트를 업데이트해요.
- 사용자 식별은 앱인토스 유저 식별키(`getUserKeyForGame` / `getAnonymousKey` 등)를 기반으로 하고, 이를 Edge Function에 넘겨 DB row를 식별해요.
- Edge Function 응답은 클라이언트가 처리하기 쉬운 JSON 구조로 통일. 에러는 HTTP status + `{ error: { code, message } }` 형태로.

### 시간대 (KST)
- DB의 모든 timestamp 컬럼은 `timestamp without time zone` 타입에 KST 값을 저장해요. `timestamptz`(UTC) 사용 금지.
- 마이그레이션에서 기본값은 `default (now() at time zone 'Asia/Seoul')`로 설정해요.
- Edge Function에서 현재 시각이 필요하면 `new Date(Date.now() + 9 * 60 * 60 * 1000)`을 사용해요. `new Date()` / `Date.now()` 단독 사용 금지.
- 오늘 날짜(date 문자열)가 필요하면 `new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)`으로 KST 기준으로 구해요.
- DB에서 읽은 KST timestamp 값을 `new Date()`로 파싱하면 Deno가 UTC로 해석하므로, 비교 상대방도 반드시 KST now (`Date.now() + 9h`)로 맞춰야 해요.

### 광고
- 광고 노출/보상은 앱인토스 인앱 광고 API를 통해서만 처리. (`docs/skills/apps-in-toss.md`의 광고 섹션 참고)
- 보상형 광고 보상 지급은 클라이언트 신호만 믿지 말고, 서버(Edge Function)에서 한 번 더 검증한 뒤 DB에 기록해요.

### React 코드 스타일
- 함수형 컴포넌트 + 훅. 클래스 컴포넌트 만들지 않기.
- 파일 안에서만 쓰는 컴포넌트는 같은 파일에 두고, 재사용되면 별도 파일로 분리.
- 의미 없는 wrapper / 추상화는 만들지 않기.

### 문서 활용
- 앱인토스 SDK API나 TDS 컴포넌트 사용법이 필요하면 `docs/skills/apps-in-toss.md`, `docs/skills/tds-mobile.md`를 Read로 직접 조회해요. (큰 문서라 자동 로드하지 않아요.)
- 문서에 없으면 `developers-apps-in-toss.toss.im` URL을 WebFetch로 확인해요.
