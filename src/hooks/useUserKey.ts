import { getAnonymousKey } from "@apps-in-toss/web-framework";
import { useEffect, useRef, useState } from "react";

// 앱 생명주기 동안 재호출을 막기 위한 Promise 싱글톤
let cachedKeyPromise: Promise<string | undefined> | null = null;

async function fetchUserKey(): Promise<string | undefined> {
  if (!cachedKeyPromise) {
    cachedKeyPromise = getAnonymousKey().catch(() => undefined);
  }
  return cachedKeyPromise;
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
