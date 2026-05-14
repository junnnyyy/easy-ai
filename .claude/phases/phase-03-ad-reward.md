# Phase 3 — Ad Reward Edge Function

**상태**: ✅ 완료
**선행**: Phase 1
**후행**: Phase 6

## 목표

`POST /functions/v1/ad-reward`를 만들어 클라이언트 광고 시청 완료 이벤트를 받아 `rewardId`를 발급한다. 발급된 ID는 Phase 2의 `ai-chat`에서 일회성으로 검증·소비된다 (API-003, AD-002).

## 관련 요구사항

FR-007, AD-002, AD-003, AD-001(데이터 모델 공유), POL- 없음

## 작업 체크리스트

### 함수 스캐폴드
- [x] `supabase/functions/ad-reward/index.ts` 생성
- [x] 요청 body 수동 검증: `{ deviceId, nonce }` (adType/rewardType은 MVP 단일 유형이라 생략)
- [x] 응답: `{ rewardId, expiresAt }`
- [x] **nonce 멱등성** — 마이그레이션 `20260514000004_ad_rewards_nonce.sql`로 `nonce` 컬럼 + `(device_id, nonce)` partial unique index 추가. 같은 (deviceId, nonce)면 기존 row 반환.

### 발급 로직
- [x] `ad_rewards` insert (`used: false`, `expires_at = now + 10min`)
- [x] 발급 직후 응답
- [x] 동시 다발 발급 방어 — partial unique index로 보장, insert 충돌 시 재조회로 멱등 복구

### 만료 정책 (AD-002 / 15.2)
- [x] `expires_at` 컬럼 사용 (TTL 10분, `_shared`에 상수 없이 ad-reward 내부 `REWARD_TTL_MINUTES`)
- [x] 만료 검증: `ai-chat`에서 `new Date(expires_at) < new Date()` 검사
- [x] 만료 검증 실패 시 `code: AD_REWARD_INVALID`

### 보안 / 무결성 (AD-002-03, 04, 05)
- [x] device_id와 rewardId를 항상 함께 검증 (다른 기기 reward 사용 불가)
- [x] `used = true` 업데이트는 **`where id=? and used=false` 조건부 update** + `.select("id")`로 영향 row 확인 → race condition 차단
- [ ] 광고 SDK 위변조 방어 — MVP는 nonce 멱등성 + device 매칭 + 일회성 update로 1차 방어. SSV 콜백 도입은 출시 후 검토.

### 로깅
- [x] 발급 이벤트는 `ad_rewards` row 자체가 로그 (created_at)
- [ ] 일/주 단위 발급·소비 카운트 SQL — 운영 단계(Phase 8 이후) 가시성 문서로 분리

## 완료 기준

- [x] 정상 요청 → 새 `rewardId` 응답. (curl 검증 완료)
- [x] 같은 `(deviceId, nonce)`로 재요청 → **같은 rewardId** 반환. (curl 검증 완료)
- [x] `ai-chat`에서 해당 `rewardId`로 1회 호출 성공, 2회 호출 시 `AD_REWARD_INVALID`.
- [x] device_id 불일치 → `AD_REWARD_INVALID`.
- [x] 10분 경과 → `AD_REWARD_INVALID`.
- [x] 동시에 두 요청이 같은 rewardId 사용 → 조건부 update로 하나만 성공.

## 결정 로그

- 만료 시간: **10분** (`REWARD_TTL_MINUTES`)
- `expired` 컬럼 대신 `expires_at` 컬럼 사용 — `ai-chat`에서 `new Date(expires_at) < new Date()`로 즉시 비교. 인덱스 불필요할 만큼 트래픽 작음.
- 멱등성 키: 명세에서 권장한 별도 `ad_redemptions` 테이블 대신 **`ad_rewards.nonce` partial unique index** 채택. 마이그레이션 1개로 끝나고 다른 테이블과 동기화 부담 없음.
- nonce 길이 제한 8~128자 (UUIDv4 36자 안전 마진).
