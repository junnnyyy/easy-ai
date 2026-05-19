-- symptom_check 기능 제거 — 의료 관련 리스크로 인해 free_chat으로 대체
delete from public.prompt_templates where request_type = 'symptom_check';
