-- DB 롤백 (선택 사항). 변경이 추가·하위호환이라 보통 실행 불필요.
-- 반드시 rollback-server.sh로 함수를 이전 코드로 되돌린 "뒤"에 실행할 것.
-- Supabase 대시보드 > SQL Editor 에서 실행.

-- 1) 멱등성 키 (마이그레이션 20260521000017)
drop index if exists public.ai_requests_device_client_req_uidx;
alter table public.ai_requests drop column if exists client_request_id;

-- 2) free_count 적립 함수 (마이그레이션 20260521000016)
drop function if exists public.increment_free_count(text);

-- 주의: ad_rewards.expires_at 의 NOT NULL 제약은 복원하지 않음.
--  - 적립 방식에서 expires_at = NULL 로 저장된 row가 있을 수 있어 복원 시 실패할 수 있음.
--  - 이전 ad-reward 코드는 expires_at 에 값을 넣으므로 nullable 이어도 정상 동작함.

-- 참고: drop 후에도 원격 마이그레이션 히스토리에는 000016/000017이 기록으로 남습니다.
-- 재배포(db push) 시 이미 적용된 것으로 간주되어 다시 실행되지 않으니,
-- 재적용이 필요하면 supabase migration repair 로 히스토리를 먼저 정리하세요.
