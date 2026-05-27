-- 나머지 테이블 timestamp 컬럼을 KST 기준 timestamp without time zone으로 변경
-- ai_requests는 이미 20260521000004에서 적용 완료

-- usage_limits
alter table public.usage_limits
  alter column created_at type timestamp without time zone
    using (created_at at time zone 'Asia/Seoul'),
  alter column created_at set default (now() at time zone 'Asia/Seoul'),
  alter column updated_at type timestamp without time zone
    using (updated_at at time zone 'Asia/Seoul'),
  alter column updated_at set default (now() at time zone 'Asia/Seoul');

-- ad_rewards
alter table public.ad_rewards
  alter column expires_at type timestamp without time zone
    using (expires_at at time zone 'Asia/Seoul'),
  alter column used_at type timestamp without time zone
    using (used_at at time zone 'Asia/Seoul'),
  alter column created_at type timestamp without time zone
    using (created_at at time zone 'Asia/Seoul'),
  alter column created_at set default (now() at time zone 'Asia/Seoul');

-- prompt_templates
alter table public.prompt_templates
  alter column created_at type timestamp without time zone
    using (created_at at time zone 'Asia/Seoul'),
  alter column created_at set default (now() at time zone 'Asia/Seoul'),
  alter column updated_at type timestamp without time zone
    using (updated_at at time zone 'Asia/Seoul'),
  alter column updated_at set default (now() at time zone 'Asia/Seoul');

-- blocked_inputs
alter table public.blocked_inputs
  alter column created_at type timestamp without time zone
    using (created_at at time zone 'Asia/Seoul'),
  alter column created_at set default (now() at time zone 'Asia/Seoul');

-- conversation_messages
alter table public.conversation_messages
  alter column created_at type timestamp without time zone
    using (created_at at time zone 'Asia/Seoul'),
  alter column created_at set default (now() at time zone 'Asia/Seoul');

-- user_quotas
alter table public.user_quotas
  alter column created_at type timestamp without time zone
    using (created_at at time zone 'Asia/Seoul'),
  alter column created_at set default (now() at time zone 'Asia/Seoul');
