-- 디바이스당 평생 무료 횟수 관리 테이블 (날짜 무관, 1회 제공)
create table public.user_quotas (
  device_id  text primary key,
  free_count int not null default 1,
  created_at timestamptz default now() not null
);

alter table public.user_quotas enable row level security;

-- 무료 횟수 차감 함수: 0 미만으로 내려가지 않음, 없으면 신규 생성 후 바로 차감
create or replace function public.decrement_free_count(p_device_id text)
returns void language plpgsql as $$
begin
  insert into public.user_quotas (device_id, free_count)
  values (p_device_id, 0)
  on conflict (device_id) do update
    set free_count = greatest(user_quotas.free_count - 1, 0);
end;
$$;
