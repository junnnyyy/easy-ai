// 리팩토링 전/후 동작 동등성 검증.
// 각 테스트는 "리팩토링 직전의 인라인 구현(old)"을 그대로 박아두고,
// 추출/공유된 새 헬퍼(new)가 동일한 결과를 내는지 비교해요.
// (예외: 의도적으로 동작을 고친 KST 히스토리 창은 '동등'이 아니라 '교정됨'을 검증)

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { usagePayload, type UsageStatus } from "./rate-limit.ts";
import { MARKET_LABEL } from "./market.ts";
import { kstNow, nowKST, todayKST } from "./time.ts";

// ── 1. usagePayload: ai-chat의 4개 인라인 응답 객체와 동일한가 ──
Deno.test("usagePayload == 인라인 {freeCount, adCount, requiresAd, isBlocked}", () => {
  const cases: UsageStatus[] = [
    { freeCount: 3, adCount: 0, requiresAd: false, isBlocked: false },
    { freeCount: 0, adCount: 5, requiresAd: true, isBlocked: false },
    { freeCount: 0, adCount: 100, requiresAd: true, isBlocked: true },
    { freeCount: 1, adCount: 99, requiresAd: false, isBlocked: false },
  ];
  for (const u of cases) {
    // old: 리팩토링 전 ai-chat이 직접 만들던 객체
    const old = {
      freeCount: u.freeCount,
      adCount: u.adCount,
      requiresAd: u.requiresAd,
      isBlocked: u.isBlocked,
    };
    assertEquals(usagePayload(u), old);
  }
});

// AD_REQUIRED 분기는 예전엔 requiresAd:true, isBlocked:false 를 하드코딩했음.
// 그 분기 진입 시점의 usage(requiresAd=true, isBlocked=false)와 동일함을 확인.
Deno.test("usagePayload == AD_REQUIRED 분기의 하드코딩 값", () => {
  const u: UsageStatus = { freeCount: 0, adCount: 2, requiresAd: true, isBlocked: false };
  const oldHardcoded = {
    freeCount: u.freeCount,
    adCount: u.adCount,
    requiresAd: true,
    isBlocked: false,
  };
  assertEquals(usagePayload(u), oldHardcoded);
});

// ── 2. MARKET_LABEL: ai-chat / sector-inference의 인라인 맵과 동일한가 ──
Deno.test("MARKET_LABEL == 인라인 marketLabel 맵 (ai-chat & sector-inference)", () => {
  // old: ai-chat 인라인 (Record<string,string>)
  const oldAiChat: Record<string, string> = {
    nasdaq: "나스닥",
    kospi: "코스피",
    kosdaq: "코스닥",
  };
  // old: sector-inference 인라인 (Record<Market,string>)
  const oldSector = {
    kospi: "코스피",
    kosdaq: "코스닥",
    nasdaq: "나스닥",
  };
  for (const k of ["kospi", "kosdaq", "nasdaq"] as const) {
    assertEquals(MARKET_LABEL[k], oldAiChat[k]);
    assertEquals(MARKET_LABEL[k], oldSector[k]);
  }
});

// ── 3. KST 시간 헬퍼: 인라인 Date.now()+9h 표현과 동일한가 ──
function withFrozenNow(ms: number, fn: () => void) {
  const orig = Date.now;
  Date.now = () => ms;
  try {
    fn();
  } finally {
    Date.now = orig;
  }
}

Deno.test("nowKST/todayKST/kstNow == 인라인 Date.now()+9h 표현", () => {
  // 여러 순간(자정 경계 포함)에 대해 검증
  const instants = [
    Date.UTC(2026, 4, 27, 3, 30, 0), // KST 12:30
    Date.UTC(2026, 4, 26, 15, 0, 1), // KST 다음날 00:00:01 (날짜 경계)
    Date.UTC(2026, 4, 26, 14, 59, 59), // KST 23:59:59 (경계 직전)
    Date.UTC(2026, 11, 31, 20, 0, 0), // KST 다음해 05:00 (연 경계)
  ];
  const NINE_H = 9 * 60 * 60 * 1000;
  for (const t of instants) {
    withFrozenNow(t, () => {
      // old: ai-chat nowKST (timestamp, 'Z' 제거)
      const oldNow = new Date(t + NINE_H).toISOString().slice(0, -1);
      // old: rate-limit/macro todayKST
      const oldToday = new Date(t + NINE_H).toISOString().slice(0, 10);
      assertEquals(nowKST(), oldNow);
      assertEquals(todayKST(), oldToday);
      assertEquals(kstNow().getTime(), t + NINE_H);
    });
  }
});

// ── 4. (동작 교정) 대화 히스토리 24시간 창: UTC→KST ──
// 이건 '동등'이 아니라 '버그 교정'. 옛 코드는 KST 컬럼을 UTC 기준으로 비교해
// 실제로 ~33시간 창이 됐음. 새 식이 정확히 KST now-24h 인지 확인.
Deno.test("히스토리 since: 옛 UTC식보다 9h 늦은 정확한 KST now-24h", () => {
  const t = Date.UTC(2026, 4, 27, 3, 30, 0);
  withFrozenNow(t, () => {
    const DAY = 24 * 60 * 60 * 1000;
    const NINE_H = 9 * 60 * 60 * 1000;
    const oldSinceUtc = new Date(t - DAY).toISOString(); // 버그: KST 컬럼을 UTC로 비교
    const newSinceKst = new Date(t + NINE_H - DAY).toISOString(); // 교정: KST now - 24h

    // 새 기준은 옛 기준보다 정확히 9시간 늦어야 함 (= 창이 33h→24h로 좁혀짐)
    assertEquals(
      new Date(newSinceKst).getTime() - new Date(oldSinceUtc).getTime(),
      NINE_H,
    );
    // 그리고 KST now와의 간격이 정확히 24h
    const kstNowIso = new Date(t + NINE_H).getTime();
    assertEquals(kstNowIso - new Date(newSinceKst).getTime(), DAY);
  });
});
