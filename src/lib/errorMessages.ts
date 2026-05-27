/**
 * 명세 12장의 사용자 표시 메시지 정의.
 * 코드 → 메시지 매핑은 단일 출처(SSOT)로 여기서만 관리.
 */

const MESSAGES: Record<string, string> = {
  // 서버 에러 코드
  DAILY_LIMIT_EXCEEDED: "오늘 사용 가능한 횟수를 모두 쓰셨어요. 내일 다시 이용해 주세요.",
  USAGE_LIMIT_EXCEEDED: "오늘 사용 가능한 횟수를 모두 쓰셨어요. 내일 다시 이용해 주세요.",
  AD_REQUIRED: "무료 사용 횟수를 모두 쓰셨어요. 광고를 보시면 더 이용할 수 있어요.",
  AD_DAILY_LIMIT_EXCEEDED: "오늘 광고 보상 한도를 모두 채웠어요. 내일 다시 이용해 주세요.",
  BLOCKED_SENSITIVE_INPUT:
    "개인정보(주민번호, 카드번호 등)가 포함된 내용은 입력할 수 없어요.",
  AD_REWARD_INVALID: "광고 보상이 만료됐거나 이미 사용되었어요. 다시 시도해 주세요.",
  AI_TIMEOUT: "AI 응답이 너무 늦어지고 있어요. 잠시 후 다시 시도해 주세요.",
  AI_IN_PROGRESS: "답변을 생성하고 있어요. 잠시만 기다려 주세요.",
  AI_ERROR: "AI 응답 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
  AI_REQUEST_FAILED: "AI 응답 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
  INPUT_TOO_LONG: "내용이 너무 길어요. 1000자 이내로 줄여 주세요.",
  MISSING_FIELDS: "요청 형식이 올바르지 않아요.",
  INVALID_JSON: "요청 형식이 올바르지 않아요.",
  TEMPLATE_NOT_FOUND: "요청 유형을 찾을 수 없어요.",

  // 클라이언트 자체 에러
  CLIENT_TIMEOUT: "응답 시간이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.",
  NETWORK_ERROR: "인터넷 연결을 확인한 뒤 다시 시도해 주세요.",
  OFFLINE: "인터넷에 연결되어 있지 않아요. 연결을 확인하고 다시 시도해 주세요.",
  SERVER_ERROR: "일시적인 문제가 발생했어요. 잠시 후 다시 시도해 주세요.",
  USER_KEY_UNAVAILABLE: "사용자 정보를 가져올 수 없어요. 토스앱을 최신 버전으로 업데이트해 주세요.",
  USER_KEY_LOADING: "잠시 후 다시 시도해 주세요.",
  IN_FLIGHT: "이미 요청 중이에요.",

  // 유효성 검사 (클라이언트)
  EMPTY_INPUT: "질문을 입력해 주세요.",
  TOO_LONG: "내용이 너무 길어요. 1000자 이내로 줄여 주세요.",
};

export function getErrorMessage(code: string, fallback?: string): string {
  return MESSAGES[code] ?? fallback ?? "오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
}
