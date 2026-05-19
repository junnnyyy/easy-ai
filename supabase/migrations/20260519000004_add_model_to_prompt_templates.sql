-- prompt_templates에 model 컬럼 추가 (기본값: gpt-4o-mini)
alter table public.prompt_templates
  add column if not exists model text not null default 'gpt-4o-mini';

-- 고품질 모델이 효과적인 기능만 gpt-5.4-mini로 지정
update public.prompt_templates
set model = 'gpt-5.4-mini'
where request_type in ('free_chat', 'stock_beneficiary');
