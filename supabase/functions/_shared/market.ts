// 시장 구분 공통 타입 + 한국어 라벨.

export type Market = "kospi" | "kosdaq" | "nasdaq";

export const MARKET_LABEL: Record<Market, string> = {
  kospi: "코스피",
  kosdaq: "코스닥",
  nasdaq: "나스닥",
};
