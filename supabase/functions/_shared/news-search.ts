// 수혜주 찾기용 뉴스 검색 — 네이버 뉴스 API (한국·해외 뉴스 모두 한국어로 검색)

import type { Market } from "./market.ts";

export type NewsItem = {
  title: string;
  description: string;
  publishedAt: string;
};

const NEWS_LIMIT = 8;
const NEWS_TIMEOUT_MS = 5_000;

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'");
}

function buildQuery(message: string, market: Market): string {
  // 나스닥은 미국·해외 시장 키워드를 덧붙여 관련도 향상
  return market === "nasdaq" ? `미국 ${message}` : message;
}

export async function searchNews(query: string, limit = NEWS_LIMIT): Promise<NewsItem[]> {
  const clientId = Deno.env.get("NAVER_CLIENT_ID");
  const clientSecret = Deno.env.get("NAVER_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    console.error("네이버 API 키가 설정되지 않았어요");
    return [];
  }

  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${limit}&sort=date`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NEWS_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!res.ok) {
      console.error("네이버 뉴스 API 오류:", res.status, await res.text());
      return [];
    }

    const json = await res.json();
    return (json.items ?? []).map((item: Record<string, string>) => ({
      title: stripHtml(item.title ?? ""),
      description: stripHtml(item.description ?? ""),
      publishedAt: item.pubDate ?? "",
    }));
  } catch (err) {
    console.error("뉴스 검색 실패:", err);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export function searchNewsForMarket(message: string, market: Market): Promise<NewsItem[]> {
  return searchNews(buildQuery(message, market));
}

export function formatNewsForPrompt(items: NewsItem[]): string {
  if (items.length === 0) {
    return "(검색 결과 없음 — 학습 데이터 안에서 답변하되, 불확실하면 명확한 수혜 종목을 찾기 어렵다고 답하세요.)";
  }

  return items
    .map((item, i) => {
      const date = item.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 10) : "날짜 미상";
      return `${i + 1}. [${date}] ${item.title}\n   ${item.description}`;
    })
    .join("\n\n");
}
