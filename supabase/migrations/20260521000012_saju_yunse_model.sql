update public.prompt_templates
set model = 'gpt-5.4-mini'
where request_type in ('saju', 'yunse');
