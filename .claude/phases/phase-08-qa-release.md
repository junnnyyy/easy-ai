# Phase 8 — QA & 출시 준비

**상태**: 🟨 코드/빌드 검증 완료, **토스앱 QR 빌드 실기 QA + 콘솔 배포만 남음**
**선행**: Phase 4, 5, 6, 7
**후행**: 없음 (MVP 출시)

## 목표

명세 17장(QA) 항목을 통과시키고, 토스 앱인토스 콘솔에 배포 가능한 상태로 마무리한다.

## 작업 체크리스트

### QA-001 기능 테스트
- [x] 자유 질문 입력 → AI 답변 생성 (curl 검증 완료)
- [x] 빈 질문 입력 → 오류 메시지 (`HomeScreen.handleSubmit`)
- [x] 1001자 질문 입력 → 길이 초과 메시지 (서버 `INPUT_TOO_LONG` + 클라이언트 가드)
- [ ] 어려운 문장 입력 → 쉬운 설명 답변 — **QR 빌드로 샘플 검증 필요**
- [ ] 스팸 문자 입력 → 가능성 판단 답변 — **QR 빌드로 샘플 검증 필요**
- [ ] 문자 변환 입력 → 자연스러운 문자 + tone별 차이 — **QR 빌드로 샘플 검증 필요**
- [x] 복사 버튼 → 클립보드 복사 성공 (`navigator.clipboard.writeText` + 토스트)
- [x] 다시 질문 → 입력 화면 복귀 (`handleReset`)

### QA-002 광고 테스트
⚠️ 인앱 광고는 **샌드박스 미지원** — 모든 광고 항목은 토스앱 QR 빌드에서 검증.
- [ ] 토스앱 버전 5.241.0+ 환경에서 배너/리워드 정상 노출 — **QR 빌드 필요**
- [ ] 토스앱 5.240.x 이하에서 광고 영역이 깨지지 않고 hide — `useTossAds` `unsupported` 분기 코드 OK, QR로 확인
- [ ] 리워드 광고 완료 → AI 호출 가능 — **QR 빌드 필요**
- [ ] 리워드 광고 중단 → AI 호출 차단 — 코드 OK, QR로 확인
- [ ] 광고 로딩 실패 → 안내 메시지 — 코드 OK, QR로 확인
- [ ] 배너 광고 no-fill / 실패 → 레이아웃 유지 — `null` 반환 정책 OK
- [x] 같은 nonce / rewardId 재사용 시도 → 차단 (Phase 3 curl 검증)
- [ ] 토스 픽셀 — **MVP 제외**

### QA-003 사용량 제한
- [x] 무료 사용 → 정상 (curl 검증)
- [x] 무료 초과 → AdGate로 전환 코드 OK (`AD_REQUIRED` → AdGate)
- [ ] 리워드 후 추가 1회 → 정상 — **QR 빌드 필요** (광고 통합 검증)
- [x] 일일 한도 초과 → 사용량 초과 메시지 (`DAILY_LIMIT_EXCEEDED`)
- [x] 자정 경과 시 카운트 리셋 — `usage_date` 일별 row로 자동 분리

### QA-004 보안 테스트
- [x] 프론트 번들에 OpenAI key 없음 (`dist/` rg 검증 완료)
- [x] DevTools에서 직접 OpenAI 호출 불가 — Edge Function이 키 보유, CORS는 `*` 허용이지만 키 필요
- [x] 주민번호/카드번호 등 패턴 입력 → 차단 (`detectSensitive` 클라+서버 이중 가드)
- [x] 비정상 request_type → 400 (`TEMPLATE_NOT_FOUND`)
- [x] 중복 동시 요청 → 한 번만 처리 (`inFlight` ref)

### WebView 동작 확인 (WV-001 ~ WV-003)
- [ ] 토스 샌드박스앱(Android)에서 전 화면 확인 — **사용자 직접**
- [ ] 토스 샌드박스앱(iOS)에서 전 화면 확인 — **사용자 직접**
- [ ] 뒤로가기 동작 (안드로이드 하드 백 / iOS 스와이프) — 토스앱 셸 위임
- [x] SafeArea 정상 처리 — TDS `FixedBottomCTA`가 자동 처리
- [ ] userKey(`getAnonymousKey`) 영속성 — 앱 재시작 후 동일 키 반환 — **QR 빌드 필요**

### 빌드 / 배포
- [x] `npm run build` 무경고 통과 (chunk size warning은 informational)
- [x] `npm run lint` 통과
- [x] 번들 사이즈: gzip 약 369KB JS + 2MB woff2 폰트. 폰트가 가장 큼 — 필요 시 dynamic-subset CSS로 교체 가능
- [ ] 앱인토스 콘솔 앱 등록 정보 확정 — **사용자 직접**
- [ ] `granite.config.ts`의 `displayName`, `primaryColor`, `icon` 최종값 — **사용자 직접 확인**
- [x] `permissions` 배열 — MVP는 기본값으로 충분 (광고 SDK는 추가 권한 불필요)
- [ ] 콘솔 API 키로 `npm run deploy` 테스트 — **사용자 직접**

### 출시 검토 항목 (명세 18.1)
- [x] 1차 MVP 조건 — README 체크리스트에서 별도 갱신
- [x] 명세 6.1 ~ 6.5 비기능 요구사항 — 코드 레벨로는 충족, 실기 QA에서 최종 확인
- [ ] 정책 문서 / 개인정보 처리 문구 — **사용자 직접 (콘솔 입력 시)**

### 운영 준비
- [ ] Supabase 대시보드 모니터링 — `ai_requests` 일일 추이 쿼리 저장 — **출시 후 작업**
- [ ] OpenAI 비용 알림 — **출시 후 작업**
- [ ] 장애 발생 시 롤백 절차 — Edge Functions 이전 버전은 `supabase functions deploy` 시점마다 자동 보존됨, 필요 시 git revert + 재배포

## 완료 기준

- [x] 코드/curl 검증 가능한 QA 항목 모두 통과
- [ ] 토스 샌드박스앱에서 end-to-end 시나리오 3회 연속 성공 — **사용자 직접 QR 빌드 검증**
- [ ] `ait deploy` 정상 완료 + 콘솔에서 빌드 확인 — **사용자 직접**
- [x] README의 MVP 출시 조건 갱신 완료

## 결정 로그

- 번들 사이즈: Pretendard Variable woff2(2MB)가 가장 큰 자산. 첫 진입 속도가 문제되면 `pretendardvariable-dynamic-subset.css`(한글 자모 단위 분할) 도입 검토.
- 토스 픽셀 / 전면 광고: MVP 제외, 출시 후 사용량 데이터를 보고 도입 여부 결정.
- 광고 / userKey 실기 검증: 본질적으로 토스앱 + QR이 필요. 코드/curl로 검증 가능한 부분은 모두 통과.
