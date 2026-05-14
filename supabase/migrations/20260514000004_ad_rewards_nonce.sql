-- ad-reward 함수의 멱등성 보장을 위한 nonce 컬럼
-- 같은 (device_id, nonce) 조합으로 두 번 발급 요청해도 동일한 row 반환되어야 함.
alter table public.ad_rewards
  add column if not exists nonce text;

-- nonce가 있는 row만 unique 제약 (기존 데이터 호환)
create unique index if not exists ad_rewards_device_nonce_uidx
  on public.ad_rewards (device_id, nonce)
  where nonce is not null;
