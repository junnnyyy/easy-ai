// 거시 지표 수집 — FRED (미국) + ECOS (한국). 하루 1회 캐싱.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const FRED_BASE = "https://api.stlouisfed.org/fred/series/observations";
const ECOS_BASE = "https://ecos.bok.or.kr/api/StatisticSearch";
const TIMEOUT_MS = 6_000;

const todayKST = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

type Point = { date: string; value: number | null };

export type MacroPayload = {
  fetchedAt: string;
  us: {
    fedFunds?: Point;     // 미국 기준금리 (FEDFUNDS)
    treasury10y?: Point;  // 미국 국채 10년 (DGS10)
    cpi?: Point;          // 미국 CPI (CPIAUCSL)
    ppi?: Point;          // 미국 PPI (PPIACO)
  };
  kr: {
    baseRate?: Point;     // 한국은행 기준금리 (722Y001 / 0101000)
    bond3y?: Point;       // 국고채 3년 (817Y002 / 010200000)
    cpi?: Point;          // 한국 CPI (901Y009 / 0)
  };
};

async function fetchFredSeries(seriesId: string, apiKey: string): Promise<Point | undefined> {
  const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.error("FRED 오류:", seriesId, res.status);
      return undefined;
    }
    const json = await res.json();
    const obs = json.observations?.[0];
    if (!obs) return undefined;
    const v = parseFloat(obs.value);
    return { date: obs.date, value: Number.isFinite(v) ? v : null };
  } catch (err) {
    console.error("FRED 호출 실패:", seriesId, err);
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ECOS 통계 코드는 (statCode, itemCode1, cycle)로 식별돼요.
async function fetchEcosSeries(
  apiKey: string,
  statCode: string,
  cycle: "M" | "D",
  itemCode1: string,
): Promise<Point | undefined> {
  // 최근 12개월 / 30일 범위에서 끝값을 가져옴
  const span = cycle === "M" ? 12 : 60;
  const end = todayKST().replace(/-/g, "").slice(0, cycle === "M" ? 6 : 8);
  const startNum = (() => {
    if (cycle === "M") {
      const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
      d.setMonth(d.getMonth() - span);
      return d.toISOString().slice(0, 7).replace("-", "");
    }
    const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
    d.setDate(d.getDate() - span);
    return d.toISOString().slice(0, 10).replace(/-/g, "");
  })();

  const url = `${ECOS_BASE}/${apiKey}/json/kr/1/100/${statCode}/${cycle}/${startNum}/${end}/${itemCode1}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.error("ECOS 오류:", statCode, res.status);
      return undefined;
    }
    const json = await res.json();
    const rows = json.StatisticSearch?.row;
    if (!rows || rows.length === 0) return undefined;
    const last = rows[rows.length - 1];
    const v = parseFloat(last.DATA_VALUE);
    return { date: last.TIME, value: Number.isFinite(v) ? v : null };
  } catch (err) {
    console.error("ECOS 호출 실패:", statCode, err);
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchFreshPayload(): Promise<MacroPayload> {
  const fredKey = Deno.env.get("FRED_API_KEY");
  const ecosKey = Deno.env.get("ECOS_API_KEY");

  const usP = fredKey
    ? Promise.all([
        fetchFredSeries("FEDFUNDS", fredKey),
        fetchFredSeries("DGS10", fredKey),
        fetchFredSeries("CPIAUCSL", fredKey),
        fetchFredSeries("PPIACO", fredKey),
      ])
    : Promise.resolve([undefined, undefined, undefined, undefined] as const);

  const krP = ecosKey
    ? Promise.all([
        fetchEcosSeries(ecosKey, "722Y001", "M", "0101000"),
        fetchEcosSeries(ecosKey, "817Y002", "D", "010200000"),
        fetchEcosSeries(ecosKey, "901Y009", "M", "0"),
      ])
    : Promise.resolve([undefined, undefined, undefined] as const);

  const [us, kr] = await Promise.all([usP, krP]);

  return {
    fetchedAt: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
    us: {
      fedFunds: us[0],
      treasury10y: us[1],
      cpi: us[2],
      ppi: us[3],
    },
    kr: {
      baseRate: kr[0],
      bond3y: kr[1],
      cpi: kr[2],
    },
  };
}

export async function getMacroIndicators(db: SupabaseClient): Promise<MacroPayload | null> {
  const today = todayKST();

  const { data: cached } = await db
    .from("macro_indicators")
    .select("payload")
    .eq("cache_date", today)
    .maybeSingle();

  if (cached?.payload) return cached.payload as MacroPayload;

  try {
    const payload = await fetchFreshPayload();
    await db
      .from("macro_indicators")
      .upsert({ cache_date: today, payload }, { onConflict: "cache_date" });
    return payload;
  } catch (err) {
    console.error("거시 지표 갱신 실패:", err);
    return null;
  }
}

function fmt(p?: Point, unit = ""): string {
  if (!p || p.value == null) return "데이터 없음";
  return `${p.value}${unit} (${p.date} 기준)`;
}

export function formatMacroForPrompt(m: MacroPayload | null): string {
  if (!m) return "(거시 지표 데이터를 불러오지 못했어요. 학습 데이터의 일반 흐름을 바탕으로 신중하게 설명해주세요.)";

  return [
    "[미국]",
    `- 기준금리(FEDFUNDS): ${fmt(m.us.fedFunds, "%")}`,
    `- 10년 국채금리(DGS10): ${fmt(m.us.treasury10y, "%")}`,
    `- CPI(CPIAUCSL, 지수): ${fmt(m.us.cpi)}`,
    `- PPI(PPIACO, 지수): ${fmt(m.us.ppi)}`,
    "",
    "[한국]",
    `- 한국은행 기준금리: ${fmt(m.kr.baseRate, "%")}`,
    `- 국고채 3년물 금리: ${fmt(m.kr.bond3y, "%")}`,
    `- 소비자물가지수(CPI): ${fmt(m.kr.cpi)}`,
  ].join("\n");
}
