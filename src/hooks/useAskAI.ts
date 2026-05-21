import { useCallback, useRef, useState } from "react";
import { api } from "../api/client";
import type { RequestType, Tone, Market, MarketCap } from "../api/client";
import { getErrorMessage } from "../lib/errorMessages";
import { detectSensitive } from "../lib/sensitive";
import { useUserKey } from "./useUserKey";

const TIMEOUT_MS = 10_000;

export type AskParams = {
  requestType: RequestType;
  message: string;
  tone?: Tone;
  market?: Market;
  marketCap?: MarketCap;
  rewardId?: string;
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

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await api.aiChat({
          deviceId: userKeyState.userKey,
          requestType: params.requestType,
          message: params.message,
          tone: params.tone,
          market: params.market,
          marketCap: params.marketCap,
          rewardId: params.rewardId,
        }, controller.signal);

        if (res.ok) {
          setAnswer(res.data.answer);
          return { ok: true, answer: res.data.answer };
        } else {
          const err = makeError(res.error.code, res.error.message);
          // AD_REQUIRED는 광고 흐름으로 처리하므로 에러 state에 노출하지 않음
          if (res.error.code !== "AD_REQUIRED") setError(err);
          return { ok: false, error: err };
        }
      } catch (e) {
        const isTimeout = e instanceof Error && e.name === "AbortError";
        const err = makeError(isTimeout ? "CLIENT_TIMEOUT" : "NETWORK_ERROR");
        setError(err);
        return { ok: false, error: err };
      } finally {
        clearTimeout(timer);
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
