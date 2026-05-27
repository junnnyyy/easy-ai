-- 거시 지표 일일 캐시 (FRED + ECOS)
-- 하루에 한 번만 외부 API 호출하도록 캐싱해요.

create table if not exists public.macro_indicators (
  cache_date date primary key,
  payload jsonb not null,
  fetched_at timestamp without time zone not null default (now() at time zone 'Asia/Seoul')
);

comment on table public.macro_indicators is '거시 경제 지표 일일 캐시 — FRED / ECOS / 시장 시황을 합쳐 JSON으로 저장';
comment on column public.macro_indicators.cache_date is 'KST 기준 캐시 날짜';
comment on column public.macro_indicators.payload is '{ us: {...}, kr: {...}, markets: {...}, fetchedAt } 형태의 정리된 지표';
