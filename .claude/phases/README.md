# 쉬운 AI — 실행 계획

요구사항 명세서(스펙) 기반 MVP 출시까지의 작업 계획이에요. 각 phase 문서에 세부 작업/완료기준이 정의돼 있어요.

## Phase 진행 상태

상태 표기: `⬜ 미착수` / `🟦 진행중` / `✅ 완료` / `🟨 사용자 액션 대기` / `⏸️ 보류`

| #   | Phase                                                     | 상태  | 핵심 산출물                                          |
| --- | --------------------------------------------------------- | --- | ----------------------------------------------- |
| 1   | [Foundation](./phase-01-foundation.md)                    | ✅   | Supabase 프로젝트, DB 스키마 5종, device_id, 환경변수       |
| 2   | [AI Chat Edge Function](./phase-02-ai-chat-function.md)   | ✅   | `ai-chat` 함수: 사용량 체크 → 민감정보 검사 → 프롬프트 분기 → 로깅   |
| 3   | [Ad Reward Edge Function](./phase-03-ad-reward.md)        | ✅   | `ad-reward` 함수: rewardId 발급/검증/일회성 사용           |
| 4   | [Frontend Core (홈 / 자유질문 / 결과)](./phase-04-frontend-core.md) | ✅   | TDS 기반 홈·결과 화면, AI API 호출 훅, 로딩/에러 처리           |
| 5   | [기능형 질문 3종](./phase-05-feature-questions.md)              | ✅   | 어려운 말 쉽게 / 스팸 확인 / 문자 변환 (말투 옵션)                |
| 6   | [광고 통합](./phase-06-ads-integration.md)                    | 🟨   | 배너(3화면) + 리워드 광고 시청 플로우 (실기 검증 대기)             |
| 7   | [정책 / 안전성 / 오류 UX](./phase-07-safety-policy.md)           | ✅   | 민감정보 클라이언트 가드, 의료/법률/금융 안내, 통일된 오류 메시지         |
| 8   | [QA & 출시 준비](./phase-08-qa-release.md)                    | 🟨   | 코드 QA 통과, QR 실기 + 콘솔 배포 대기                       |

## 의존성

```
Phase 1 (Foundation)
   ├─ Phase 2 (AI Chat)
   │     └─ Phase 4 (Frontend Core) ─┐
   │           └─ Phase 5 (기능형)    ├─ Phase 7 ─ Phase 8
   └─ Phase 3 (Ad Reward) ─ Phase 6 ─┘
```

- Phase 1은 모든 백엔드 작업의 선행 조건.
- Phase 4는 Phase 2가 최소 한 가지 request_type(`free_chat`)이라도 동작해야 시작 가능.
- Phase 6은 Phase 3(rewardId 검증)이 끝나야 리워드 광고 플로우를 닫을 수 있음.
- Phase 7은 다른 기능 phase들에 가드/문구를 끼워 넣는 작업이라 가능한 한 일찍 부분 시작 가능.

## MVP 출시 가능 조건 (요구사항 18.1)

아래 항목이 모두 ✅ 되어야 MVP 배포 가능:

- [x] 자유 질문 정상 동작 (Phase 2, 4) — curl 검증 완료
- [x] 어려운 말 쉽게 설명하기 (Phase 2, 5) — 코드/프롬프트 OK, 응답 품질은 QR로 샘플 확인
- [x] 스팸 문자 확인하기 (Phase 2, 5) — 코드/프롬프트 OK, 응답 품질은 QR로 샘플 확인
- [x] 문자 쉽게 바꾸기 (Phase 2, 5) — 코드/프롬프트 OK, tone별 응답은 QR로 샘플 확인
- [x] 리워드 광고 완료 후 AI 호출 (Phase 3, 6) — 코드 흐름 OK, **실기 검증 대기**
- [x] AI API Key 프론트엔드 미노출 (Phase 1, 2) — `dist/` 검증 완료
- [x] 기기별 하루 사용량 제한 동작 (Phase 1, 2) — `usage_limits` + `increment_usage` RPC
- [x] 민감 정보 입력 차단 (Phase 2, 7) — 클라+서버 이중 가드
- [x] AI 요청 로그 저장 (Phase 1, 2) — `ai_requests` 테이블
- [x] 배너 광고 표시 (Phase 6) — Home/FeatureInput/Result 3화면, **실기 검증 대기**
- [ ] WebView 앱에서 정상 동작 (Phase 8) — **사용자 QR 빌드 검증 필요**
- [x] 주요 오류 메시지 표시 (Phase 7) — `errorMessages.ts` 단일 출처

## 범위 외 (MVP 제외)

- 로그인 / 회원가입 / 결제
- 음성 입력, 이미지 인식
- 채팅 히스토리 조회
- 관리자 페이지

향후 확장 후보는 명세서 19장 참고.

## 작업 규칙

1. 각 phase를 시작할 때 해당 문서의 상태를 🟦 로 변경.
2. 체크리스트 항목은 PR/커밋 단위로 끝나면 즉시 체크.
3. phase 완료 시 `완료 기준`을 모두 만족했는지 확인하고 ✅ 로 표기.
4. 진행 중 스펙 충돌이나 결정이 필요하면 해당 phase 문서 하단 `결정 로그`에 기록.
