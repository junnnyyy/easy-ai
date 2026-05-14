-- DB-001: ai_requests
create table if not exists public.ai_requests (
  id              uuid primary key default gen_random_uuid(),
  device_id       text not null,
  request_type    text not null,
  user_input_length int,
  ai_output       text,
  status          text not null default 'processing', -- processing | success | failed
  error_message   text,
  model_name      text,
  ad_watched      boolean not null default false,
  prompt_tokens   int,
  completion_tokens int,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- DB-002: usage_limits
create table if not exists public.usage_limits (
  id             uuid primary key default gen_random_uuid(),
  device_id      text not null,
  usage_date     date not null,
  free_count     int not null default 0,
  ad_count       int not null default 0,
  blocked_count  int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (device_id, usage_date)
);

create index if not exists usage_limits_device_date_idx on public.usage_limits (device_id, usage_date);

-- DB-003: ad_rewards
create table if not exists public.ad_rewards (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null,
  used        boolean not null default false,
  used_at     timestamptz,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists ad_rewards_device_idx on public.ad_rewards (device_id, used);

-- DB-004: prompt_templates
create table if not exists public.prompt_templates (
  id               uuid primary key default gen_random_uuid(),
  request_type     text not null unique,
  system_prompt    text not null,
  user_template    text not null,
  max_output_tokens int not null default 1024,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- DB-005: blocked_inputs
create table if not exists public.blocked_inputs (
  id           uuid primary key default gen_random_uuid(),
  device_id    text not null,
  input_preview text,  -- 전문 저장 금지, 앞 20자만
  created_at   timestamptz not null default now()
);

-- RLS: 모든 테이블은 service_role 외 접근 차단
alter table public.ai_requests    enable row level security;
alter table public.usage_limits   enable row level security;
alter table public.ad_rewards     enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.blocked_inputs enable row level security;

-- anon/authenticated role에는 아무 정책도 없으므로 자동 차단됨
-- Edge Function은 service_role key를 사용하므로 RLS 우회
