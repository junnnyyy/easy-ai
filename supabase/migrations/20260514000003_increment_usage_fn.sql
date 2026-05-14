-- 사용량 카운터를 원자적으로 upsert+increment하는 함수
-- Edge Function의 service_role 호출 전용 (RLS 우회)
create or replace function increment_usage(
  p_device_id  text,
  p_usage_date date,
  p_column     text  -- 'free_count' | 'ad_count' | 'blocked_count'
) returns void
language plpgsql
security definer
as $$
begin
  if p_column not in ('free_count', 'ad_count', 'blocked_count') then
    raise exception 'invalid column: %', p_column;
  end if;

  insert into public.usage_limits (device_id, usage_date, free_count, ad_count, blocked_count)
  values (
    p_device_id,
    p_usage_date,
    case when p_column = 'free_count'    then 1 else 0 end,
    case when p_column = 'ad_count'      then 1 else 0 end,
    case when p_column = 'blocked_count' then 1 else 0 end
  )
  on conflict (device_id, usage_date) do update
    set
      free_count    = usage_limits.free_count    + case when p_column = 'free_count'    then 1 else 0 end,
      ad_count      = usage_limits.ad_count      + case when p_column = 'ad_count'      then 1 else 0 end,
      blocked_count = usage_limits.blocked_count + case when p_column = 'blocked_count' then 1 else 0 end,
      updated_at    = now();
end;
$$;
