const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

async function callEdgeFunction<T>(
  path: string,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<ApiResponse<T>> {
  const url = `${SUPABASE_URL}/functions/v1/${path}`;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    return {
      ok: false,
      error: json.error ?? { code: "UNKNOWN", message: "알 수 없는 오류가 발생했어요." },
    };
  }

  return { ok: true, data: json as T };
}

export type RequestType =
  | "free_chat"
  | "explain_easy"
  | "spam_check"
  | "rewrite_message"
  | "reply_help"
  | "phone_check"
  | "english_explain"
  | "proofread"
  | "stock_beneficiary";
export type Tone = "formal" | "casual" | "simple";

export type AiChatRequest = {
  deviceId: string;
  requestType: RequestType;
  message: string;
  tone?: Tone;
  rewardId?: string;
};

export type AiChatResponse = {
  answer: string;
  requestId: string;
  usage: {
    freeCount: number;
    adCount: number;
    requiresAd: boolean;
    isBlocked: boolean;
  };
};

export type AdRewardRequest = {
  deviceId: string;
  nonce: string;
};

export type AdRewardResponse = {
  rewardId: string;
  expiresAt: string;
};

export const api = {
  aiChat: (req: AiChatRequest, signal?: AbortSignal) =>
    callEdgeFunction<AiChatResponse>("ai-chat", req, signal),

  issueAdReward: (req: AdRewardRequest) =>
    callEdgeFunction<AdRewardResponse>("ad-reward", req),
};
