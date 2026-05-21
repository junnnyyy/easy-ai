-- free_chat 대화 히스토리 저장 테이블 (device_id별 최근 10개 컨텍스트 유지용)
create table public.conversation_messages (
  id        bigint generated always as identity primary key,
  device_id text not null,
  role      text not null check (role in ('user', 'assistant')),
  content   text not null,
  created_at timestamptz default now() not null
);

create index on public.conversation_messages (device_id, created_at desc);

alter table public.conversation_messages enable row level security;
-- Edge Function은 service role key로 접근하므로 RLS 정책 불필요
