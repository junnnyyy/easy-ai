import type { RequestType, Tone } from "../api/client";

export type FeatureConfig = {
  key:
    | "explain_easy"
    | "spam_check"
    | "rewrite_message"
    | "reply_help"
    | "phone_check"
    | "english_explain"
    | "proofread"
    | "stock_beneficiary";
  title: string;
  description: string;
  placeholder: string;
  examples: string[];
  requestType: RequestType;
  hasTone?: true;
};

export const FEATURE_CONFIGS: Record<FeatureConfig["key"], FeatureConfig> = {
  reply_help: {
    key: "reply_help",
    title: "답장 도우미",
    description: "받은 문자를 붙여넣으면 뭐라고 답할지 알려드려요.",
    placeholder: "예) 어머님, 이번 주 토요일 경로당 행사에 참석하실 수 있으신가요?",
    examples: [
      "어머님, 이번 주 토요일 경로당 행사에 참석하실 수 있으신가요?",
      "아버지, 오늘 저녁 같이 드실 수 있어요? 제가 갈게요.",
    ],
    requestType: "reply_help",
    hasTone: true,
  },
  phone_check: {
    key: "phone_check",
    title: "수상한 전화·문자 확인",
    description: "받은 문자나 전화번호를 붙여넣으면 사기인지 확인해드려요.",
    placeholder: "예) 070-1234-5678 / [KB국민은행] 본인인증이 필요합니다. 링크를 클릭하세요.",
    examples: [
      "[KB국민은행] 본인인증이 필요합니다. 아래 링크를 클릭하세요. http://...",
      "안녕하세요 고객님, 건강보험 환급금 128만원이 있습니다. 070-1234-5678로 연락주세요.",
    ],
    requestType: "phone_check",
  },
  english_explain: {
    key: "english_explain",
    title: "영어 문자 해석",
    description: "앱 알림이나 해외 문자에 나오는 영어를 쉽게 설명해드려요.",
    placeholder: "예) Your order has been shipped. Estimated delivery: 3-5 business days.",
    examples: [
      "Your order has been shipped. Estimated delivery: 3-5 business days.",
      "Your password will expire in 7 days. Please update it to keep your account secure.",
    ],
    requestType: "english_explain",
  },
  stock_beneficiary: {
    key: "stock_beneficiary",
    title: "수혜주 찾기",
    description: "뉴스나 정책을 입력하면 어떤 종목이 수혜를 받을지 알려드려요.",
    placeholder: "예) 정부가 반도체 보조금을 대폭 늘리기로 했다",
    examples: [
      "정부가 반도체 보조금을 대폭 늘리기로 했다",
      "미국이 중국산 전기차에 고율 관세를 부과했다",
    ],
    requestType: "stock_beneficiary",
  },
  proofread: {
    key: "proofread",
    title: "문자 맞춤법 고치기",
    description: "보내기 전에 맞춤법과 어색한 표현을 고쳐드려요.",
    placeholder: "예) 오늘 병원에 갔다왔는데 의사선생님이 약을 먹으래요",
    examples: [
      "오늘 병원에 갔다왔는데 의사선생님이 약을 먹으래요",
      "아들아 나 오늘 친구 만나서 좀 늦을꺼야 저녁 먼저 먹어라",
    ],
    requestType: "proofread",
  },
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
