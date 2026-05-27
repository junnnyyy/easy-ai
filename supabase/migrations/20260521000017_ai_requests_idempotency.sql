-- ai-chat 멱등성: 응답이 클라에 전달되지 못해도 같은 요청을 재시도하면
-- 저장된 답변을 재차감 없이 돌려주기 위한 키.
-- (성공한 row만 키를 유지; 실패 시 client_request_id를 null로 풀어 재시도 허용)

alter table public.ai_requests
  add column if not exists client_request_id text;

create unique index if not exists ai_requests_device_client_req_uidx
  on public.ai_requests (device_id, client_request_id)
  where client_request_id is not null;
