import type { RequestType, Tone } from "../api/client";

export type FeatureConfig = {
  key: "explain_easy" | "spam_check" | "rewrite_message";
  title: string;
  description: string;
  placeholder: string;
  examples: string[];
  requestType: RequestType;
  hasTone?: true;
};

export const FEATURE_CONFIGS: Record<FeatureConfig["key"], FeatureConfig> = {
  explain_easy: {
    key: "explain_easy",
    title: "어려운 말 쉽게 설명",
    description: "어려운 단어나 문장을 누구나 알 수 있게 쉽게 풀어드려요.",
    placeholder: "예) 본 고지서는 납부기한 경과 시 가산금이 부과될 수 있습니다.",
    examples: [
      "본 고지서는 납부기한 경과 시 가산금이 부과될 수 있습니다.",
      "임차인은 임대차 계약 만료 전 1개월 이내에 갱신 거절 의사를 표시해야 합니다.",
    ],
    requestType: "explain_easy",
  },
  spam_check: {
    key: "spam_check",
    title: "스팸 문자 확인",
    description: "의심스러운 문자를 붙여넣으면 사기 가능성을 확인해드려요.",
    placeholder: "예) [국민은행] 보안카드 갱신이 필요합니다. 아래 링크를 클릭하세요.",
    examples: [
      "[국민은행] 보안카드 갱신이 필요합니다. 아래 링크를 클릭하세요.",
      "고객님 택배가 주소 불명으로 반송되었습니다. 확인: http://...",
    ],
    requestType: "spam_check",
  },
  rewrite_message: {
    key: "rewrite_message",
    title: "문자 쉽게 바꾸기",
    description: "보내고 싶은 내용을 입력하면 자연스러운 문자로 바꿔드려요.",
    placeholder: "예) 엄마 오늘 병원 같이 가",
    examples: [
      "엄마 오늘 병원 같이 가",
      "선생님한테 애가 오늘 학교 못 간다고 해야 해",
    ],
    requestType: "rewrite_message",
    hasTone: true,
  },
};

export const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: "formal", label: "공손하게" },
  { value: "casual", label: "편하게" },
  { value: "simple", label: "짧게" },
];
