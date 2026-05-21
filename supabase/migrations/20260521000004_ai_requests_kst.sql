-- ai_requests: created_at, updated_at을 KST 기준 timestamp로 변경
-- 1) 컬럼 타입을 timestamp without time zone으로 변경하면서 기존 UTC 값을 KST로 변환 (AT TIME ZONE 'Asia/Seoul' = +9h)
-- 2) 신규 row 기본값도 KST 기준 now()로 변경
alter table public.ai_requests
  alter column created_at type timestamp without time zone
    using (created_at at time zone 'Asia/Seoul'),
  alter column created_at set default (now() at time zone 'Asia/Seoul'),
  alter column updated_at type timestamp without time zone
    using (updated_at at time zone 'Asia/Seoul'),
  alter column updated_at set default (now() at time zone 'Asia/Seoul');
