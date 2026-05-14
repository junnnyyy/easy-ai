# Phase 7 — 정책 / 안전성 / 오류 UX

**상태**: ✅ 완료
**선행**: Phase 4, 5 (가드/문구를 끼워 넣을 화면이 존재해야 함)
**후행**: Phase 8

## 목표

명세 12, 13, 16, 17, POL-001, POL-002, NFR-005 를 모아 사용자 경험 안전망을 마무리한다. 가능한 한 일찍 일부 항목을 다른 phase와 병행해도 됨.

## 작업 체크리스트

### 민감정보 클라이언트 가드 (FR-013, POL-002)
- [x] 입력창 하단 주의 문구 — Home/FeatureInput 모두 "주민번호, 카드번호, 계좌번호 등 개인정보는 입력하지 마세요."
- [x] 클라이언트 1차 패턴 검사 (`src/lib/sensitive.ts`) — 서버와 동일 패턴
- [x] 의심 시 전송 차단 + `BLOCKED_SENSITIVE_INPUT` 메시지 표시 — `useAskAI` 사전 가드
- [x] 서버 응답과 동일 메시지로 통일 (`errorMessages.ts`)

### 통일된 오류 메시지 (명세 12장)
- [x] `src/lib/errorMessages.ts` — 모든 메시지 단일 소스
- [x] `getErrorMessage(code, fallback)` 유틸 — `useAskAI`에서 사용
- [x] 토스트 vs 인라인 정책:
  - 폼/응답 에러 → 입력창 위 인라인 텍스트
  - 광고 시청 결과 → `useToast`
  - 복사 결과 → `useToast`

### 의료/법률/금융 안내 문구 (POL-001)
- [x] 프롬프트 시드(PR-002, PR-003)에 "전문가에게 직접 물어보시는 것이 좋아요" 안내 포함
- [x] `ResultScreen` 하단에 영구 안내: "AI 답변은 참고용이에요. 의료·법률·금융 관련 내용은 전문가에게 확인해 주세요."
- [ ] 응답 키워드 감지 후 추가 배너 — MVP 범위 외 (프롬프트 + 화면 하단 안내로 충분)

### 네트워크 / 안정성 (NFR-005)
- [x] 오프라인 감지 — `navigator.onLine` 사전 가드 (`useAskAI`)
- [x] 인터넷 끊김 → `OFFLINE` 코드 + 안내 메시지
- [x] 네트워크 실패 일반 → `NETWORK_ERROR` 메시지
- [x] AbortController로 10초 타임아웃 (`CLIENT_TIMEOUT`)
- [ ] 재시도 1회 옵션 — MVP는 사용자 수동 재시도. 자동 재시도는 토큰 비용/멱등성 고민 필요해 미적용.

### WebView 동작 (WV-001, NFR-005-05)
- [x] 뒤로가기 — 자체 state machine으로 결과→홈, 입력→홈 처리 (`NavBar.onBack`)
- [ ] 시스템 뒤로가기(`useBackEvent`) — WebView에서 직접 사용 불가, 토스앱 셸 위임. Phase 8 QA에서 검증.
- [x] 외부 링크 — MVP는 외부 링크 노출 없음

### 접근성 / 사용성 (NFR-003)
- [x] TDS `Button` size `xlarge` / `medium` 사용 — 자동 터치영역 확보
- [x] 화면당 주요 버튼 1개 (`FixedBottomCTA`)
- [x] 색만으로 정보 전달 금지 — 에러는 빨간색 + 텍스트 동시 노출

## 완료 기준

- [x] 명세 12장의 주요 오류 메시지 코드/문구가 `errorMessages.ts`에 정의되고 일관되게 노출
- [x] 입력창에 주민번호 형태를 넣으면 전송 전 차단됨 (`detectSensitive` 사전 가드)
- [x] 오프라인 상태에서 시도 시 `OFFLINE` 안내 (`navigator.onLine` 가드)
- [x] 결과 화면 가독성: fontSize 17, line-height 1.7, word-break keep-all

## 결정 로그

- 민감정보 패턴: 서버(`supabase/functions/_shared/sensitive.ts`)와 클라이언트(`src/lib/sensitive.ts`) 두 군데에 동일 정의. 추가 패턴이 생기면 양쪽 동시 갱신 필요.
- 자동 재시도: MVP에서 미적용. 토큰 비용/사용자 의도와의 멱등성 충돌 우려. 사용자 수동 재시도 + 명확한 메시지로 대체.
- 의료/법률/금융 분야 키워드 감지: MVP 범위 외. 프롬프트의 안내 지침 + ResultScreen 영구 배너로 갈음.
- 시스템 뒤로가기: WebView에서 직접 핸들 불가. 토스앱 셸 위임 + Phase 8 QR 실기 검증.
