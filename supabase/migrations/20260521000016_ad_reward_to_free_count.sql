-- 광고 보상 구조 변경: rewardId를 ai-chat에서 소비하던 방식 →
-- 광고 시청 시 free_count를 즉시 적립하고, ai-chat은 free_count만 소진.
-- (느린 AI 호출이 클라 타임아웃으로 끊겨도 적립된 크레딧은 보존됨)

-- 무료 횟수 적립 함수: 없으면 신규 생성, 있으면 +1
create or replace function public.increment_free_count(p_device_id text)
returns void language plpgsql as $$
begin
  insert into public.user_quotas (device_id, free_count)
  values (p_device_id, 1)
  on conflict (device_id) do update
    set free_count = user_quotas.free_count + 1;
end;
$$;

-- ad_rewards는 이제 (device_id, nonce) 멱등성/감사 로그로만 사용.
-- used / expires_at는 더 이상 소비에 쓰이지 않으므로 NOT NULL 제약 해제.
alter table public.ad_rewards
  alter column expires_at drop not null;
