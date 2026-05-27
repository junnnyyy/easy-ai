// 종목 → 섹터 키워드 추론 (짧은 LLM 호출)
// 섹터 뉴스 검색용 한국어 키워드 1~3개를 뽑아요.

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const TIMEOUT_MS = 8_000;

export type Market = "kospi" | "kosdaq" | "nasdaq";

const marketLabel: Record<Market, string> = {
  kospi: "코스피",
  kosdaq: "코스닥",
  nasdaq: "나스닥",
};

export async function inferSectorKeywords(symbolName: string, market: Market): Promise<string[]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.4-mini",
        messages: [
          {
            role: "system",
            content:
              '너는 한국 투자자가 이해할 수 있는 섹터 키워드 추출기야. ' +
              '입력으로 시장과 종목명이 주어지면, 그 종목이 속한 산업·섹터를 대표하는 한국어 키워드 1~3개를 JSON 배열로만 출력해. ' +
              '키워드는 네이버 뉴스 검색에 그대로 쓸 수 있는 한국어 단어/짧은 구여야 해 (예: "반도체", "2차전지", "전기차", "AI 반도체", "바이오 신약"). ' +
              '다른 설명·코드블록·접두어 없이 JSON 배열만 출력해. 예: ["반도체", "메모리"]. ' +
              '모르겠으면 빈 배열 []을 출력해.',
          },
          {
            role: "user",
            content: `시장: ${marketLabel[market]}\n종목명: ${symbolName}`,
          },
        ],
        max_completion_tokens: 80,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      console.error("섹터 추론 실패:", res.status, await res.text());
      return [];
    }

    const json = await res.json();
    const raw: string = json.choices?.[0]?.message?.content ?? "";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    try {
      const parsed = JSON.parse(match[0]);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((s): s is string => typeof s === "string" && s.trim().length > 0).slice(0, 3);
    } catch {
      return [];
    }
  } catch (err) {
    console.error("섹터 추론 오류:", err);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}
