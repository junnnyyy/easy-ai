import { useCallback, useRef, useState } from "react";
import { api } from "../api/client";
import type { RequestType, Tone, Market, MarketCap } from "../api/client";
import { getErrorMessage } from "../lib/errorMessages";
import { detectSensitive } from "../lib/sensitive";
import { useUserKey } from "./useUserKey";

const TIMEOUT_MS = 90_000; // 첫 시도: 답변 생성 대기
const RETRY_TIMEOUT_MS = 30_000; // 재시도: 저장된 답변 회수(빠름)
const IN_PROGRESS_DELAY_MS = 4_000; // 서버 생성 중일 때 재시도 간격
const MAX_ATTEMPTS = 5;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type AskParams = {
  requestType: RequestType;
  message: string;
  tone?: Tone;
  market?: Market;
  marketCap?: MarketCap;
  symbolName?: string;
};

export type AskError = { code: string; message: string };

type AskResult =
  | { ok: true; answer: string }
  | { ok: false; error: AskError };

type Status = "idle" | "loading";

function makeError(code: string, fallback?: string): AskError {
  return { code, message: getErrorMessage(code, fallback) };
}

export function useAskAI() {
  const userKeyState = useUserKey();
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<AskError | null>(null);
  const inFlight = useRef(false);

  const ask = useCallback(
    async (params: AskParams): Promise<AskResult> => {
      if (inFlight.current) {
        return { ok: false, error: makeError("IN_FLIGHT") };
      }

      // 사전 가드 1: 사용자 키
      if (userKeyState.status === "error") {
        const err = makeError("USER_KEY_UNAVAILABLE");
        setError(err);
        return { ok: false, error: err };
      }
      if (userKeyState.status === "loading") {
        const err = makeError("USER_KEY_LOADING");
        setError(err);
        return { ok: false, error: err };
      }

      // 사전 가드 2: 오프라인 감지
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        const err = makeError("OFFLINE");
        setError(err);
        return { ok: false, error: err };
      }

      // 사전 가드 3: 클라이언트 민감정보 1차 차단 (POL-002)
      const sensitive = detectSensitive(params.message);
      if (sensitive.detected) {
        const err = makeError("BLOCKED_SENSITIVE_INPUT");
        setError(err);
        return { ok: false, error: err };
      }

      inFlight.current = true;
      setStatus("loading");
      setError(null);
      setAnswer(null);

      // 멱등성 키: 응답이 유실돼도 같은 키로 재시도하면 서버가 저장된 답변을 돌려줌
      const clientRequestId = crypto.randomUUID();
      let lastError: AskError = makeError("NETWORK_ERROR");

      try {
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          const controller = new AbortController();
          const ms = attempt === 0 ? TIMEOUT_MS : RETRY_TIMEOUT_MS;
          const timer = setTimeout(() => controller.abort(), ms);

          try {
            const res = await api.aiChat({
              deviceId: userKeyState.userKey,
              requestType: params.requestType,
              message: params.message,
              tone: params.tone,
              market: params.market,
              marketCap: params.marketCap,
              symbolName: params.symbolName,
              clientRequestId,
            }, controller.signal);

            if (res.ok) {
              setAnswer(res.data.answer);
              return { ok: true, answer: res.data.answer };
            }

            // 서버에서 아직 생성 중 → 잠시 후 같은 키로 재시도
            if (res.error.code === "AI_IN_PROGRESS") {
              lastError = makeError(res.error.code, res.error.message);
              await sleep(IN_PROGRESS_DELAY_MS);
              continue;
            }

            // AD_REQUIRED 등 그 외 에러는 즉시 종료
            const err = makeError(res.error.code, res.error.message);
            if (res.error.code !== "AD_REQUIRED") setError(err);
            return { ok: false, error: err };
          } catch (e) {
            // 타임아웃/네트워크 끊김 → 서버는 답변을 저장했을 수 있으니 멱등 키로 재시도
            const isTimeout = e instanceof Error && e.name === "AbortError";
            lastError = makeError(isTimeout ? "CLIENT_TIMEOUT" : "NETWORK_ERROR");
          } finally {
            clearTimeout(timer);
          }
        }

        // 모든 재시도 실패
        setError(lastError);
        return { ok: false, error: lastError };
      } finally {
        inFlight.current = false;
        setStatus("idle");
      }
    },
    [userKeyState],
  );

  const reset = useCallback(() => {
    setAnswer(null);
    setError(null);
    setStatus("idle");
  }, []);

  return { ask, status, answer, error, reset };
}
