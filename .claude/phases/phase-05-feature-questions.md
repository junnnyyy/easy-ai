# Phase 5 — 기능형 질문 3종

**상태**: ✅ 완료
**선행**: Phase 2, Phase 4
**후행**: Phase 7, 8

## 목표

홈 화면의 기능 카드 3개를 실제 입력 화면과 연결한다. 각 기능은 동일한 UI 패턴(기능명 / 설명 / 예시 / 입력창 / 전송 버튼)을 공유하되 request_type만 다르다.

## 관련 요구사항

FR-003, FR-004, FR-005, FR-006, UI-002, PR-003, PR-004, PR-005

## 공통 컴포넌트

### `FeatureInputScreen` (재사용)
- props: `featureKey`, `title`, `description`, `examples`, `requestType`, `extraField?`
- 구성: 뒤로가기 / 제목 / 설명 / 예시 chip / `TextArea` / "AI에게 물어보기" / 주의문 / 광고 placeholder

```tsx
type FeatureConfig = {
  key: 'explain_easy' | 'spam_check' | 'rewrite_message';
  title: string;
  description: string;
  examples: string[];
  placeholder: string;
  extraField?: 'tone'; // rewrite_message용
};
```

## 작업 체크리스트

### 어려운 말 쉽게 설명하기 (FR-004)
- [x] 기능 카드 → `FeatureInputScreen` 라우팅 (`App.tsx`)
- [x] title/description/examples — `FEATURE_CONFIGS.explain_easy`
- [x] requestType: `explain_easy`
- [x] 결과 화면에서 답변 형식 확인 — 프롬프트(PR-003 시드)에서 처리

### 스팸 문자 확인하기 (FR-005)
- [x] title/description/examples — `FEATURE_CONFIGS.spam_check`
- [x] requestType: `spam_check`
- [x] 결과 화면에 "참고용" 안내 문구 — `ResultScreen` 하단

### 문자 쉽게 바꾸기 (FR-006)
- [x] title/description/examples — `FEATURE_CONFIGS.rewrite_message`
- [x] **말투 옵션 UI** — `SegmentedControl` (formal / casual / simple)
- [x] 선택된 tone을 API에 함께 전송 (`useAskAI`의 `tone` 파라미터)
- [x] 결과 화면 표시 — 프롬프트(PR-005 시드)에서 처리

### 기능 카드 (FR-003)
- [x] 홈에서 3개 카드 컴포넌트 — `HomeScreen.FeatureCard`
- [x] 클릭 시 해당 기능 화면으로 이동
- [x] 큰 텍스트 / 큰 터치 영역 (minHeight 64)

### 입력 화면 공통
- [x] 예시 chip 클릭 시 입력창에 자동 채움
- [x] 1000자 제한 + 잔여 카운터 (`TextArea.help`)
- [x] 개인정보 주의 문구 (입력창 하단)
- [x] Phase 6 광고 placeholder (`BannerPlaceholder`) — Phase 6에서 실제 광고로 교체

## 완료 기준

- [x] 3개 기능 모두 홈 카드 → 입력 → 결과 흐름이 정상 동작 (코드 검토)
- [x] `request_type` 값이 백엔드 로그(`ai_requests`)에 정확히 기록됨 (ai-chat 함수 검증)
- [ ] 문자 변환은 tone에 따라 다른 결과 — Phase 8 QA에서 샘플 응답 검증
- [ ] 스팸 확인 답변에 판단 키워드("위험해요/조심하세요/안전해요") — Phase 8 QA에서 샘플 응답 검증

## 결정 로그

- 화면 별도로 만들지 않고 `FeatureInputScreen` 1개에 `FEATURE_CONFIGS`(`src/features/featureConfigs.ts`)로 분기 — 보일러플레이트 절약.
- tone 옵션은 명세의 6종 대신 **3종(formal / casual / simple)** 으로 단순화 — 어르신 대상 UX 단순성 우선. 필요 시 `featureConfigs.ts`의 `TONE_OPTIONS`만 추가하면 확장 가능.
