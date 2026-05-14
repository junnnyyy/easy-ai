import { getAnonymousKey } from "@apps-in-toss/web-framework";
import { useEffect, useRef, useState } from "react";

// 앱 생명주기 동안 재호출을 막기 위한 Promise 싱글톤
let cachedKeyPromise: Promise<string | undefined> | null = null;
const USER_KEY_TIMEOUT_MS = 2500;

function normalizeUserKey(value: unknown): string | undefined {
  // SDK가 'INVALID_CATEGORY' | 'ERROR' 같은 에러 문자열을 반환할 수 있으므로 거른다.
  if (typeof value === "string") {
    if (value === "INVALID_CATEGORY" || value === "ERROR") return undefined;
    return value.length > 0 ? value : undefined;
  }
  if (value && typeof value === "object") {
    const obj = value as { hash?: unknown; userKey?: unknown; anonymousKey?: unknown };
    const maybeKey = obj.hash ?? obj.userKey ?? obj.anonymousKey;
    if (typeof maybeKey === "string" && maybeKey.length > 0) {
      return maybeKey;
    }
  }
  return undefined;
}

function getDevFallbackKey(): string | undefined {
  if (!import.meta.env.DEV) return undefined;
  try {
    const keyName = "easy-ai-dev-user-key";
    const existing = window.localStorage.getItem(keyName);
    if (existing) return existing;
    const generated = `dev-${crypto.randomUUID()}`;
    window.localStorage.setItem(keyName, generated);
    return generated;
  } catch {
    return "dev-fallback-user-key";
  }
}

async function fetchUserKey(): Promise<string | undefined> {
  if (!cachedKeyPromise) {
    const fetchWithTimeout = Promise.race<unknown>([
      getAnonymousKey(),
      new Promise<string | undefined>((resolve) => {
        setTimeout(() => resolve(undefined), USER_KEY_TIMEOUT_MS);
      }),
    ]);

    cachedKeyPromise = fetchWithTimeout
      .then((key) => normalizeUserKey(key) ?? getDevFallbackKey())
      .catch(() => getDevFallbackKey());
  }
  return cachedKeyPromise;
}

// 앱 진입 시점에 미리 user key 발급 시작 (warm-up)
export function preloadUserKey(): void {
  void fetchUserKey();
}

export type UserKeyState =
  | { status: "loading" }
  | { status: "ready"; userKey: string }
  | { status: "error" }; // 키 발급 실패 — AI 호출 차단

export function useUserKey(): UserKeyState {
  const [state, setState] = useState<UserKeyState>({ status: "loading" });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetchUserKey().then((key) => {
      if (!mounted.current) return;
      if (key) {
        setState({ status: "ready", userKey: key });
      } else {
        // undefined: 구버전 토스앱이거나 비정상 환경
        setState({ status: "error" });
      }
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  return state;
}
