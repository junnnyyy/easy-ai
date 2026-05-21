-- 기능별 컨텍스트 분리를 위해 request_type 컬럼 추가
alter table public.conversation_messages
  add column request_type text not null default 'free_chat';

drop index if exists conversation_messages_device_id_created_at_idx;
create index on public.conversation_messages (device_id, request_type, created_at desc);
