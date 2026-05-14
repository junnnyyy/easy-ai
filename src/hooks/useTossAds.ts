import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useState } from "react";

type TossAdsState =
  | { status: "unsupported" } // 토스앱 5.241.0 미만 또는 브라우저 환경
  | { status: "loading" }
  | { status: "ready" }
  | { status: "failed"; error: Error };

// 앱 라이프사이클 동안 1회만 초기화 (싱글톤 약속)
let initialized = false;
let initListeners: Array<(state: TossAdsState) => void> = [];
let currentState: TossAdsState = { status: "loading" };

function setState(next: TossAdsState) {
  currentState = next;
  initListeners.forEach((fn) => fn(next));
}

function initializeOnce() {
  if (initialized) return;
  initialized = true;

  try {
    if (!TossAds.initialize.isSupported()) {
      setState({ status: "unsupported" });
      return;
    }

    TossAds.initialize({
      callbacks: {
        onInitialized: () => setState({ status: "ready" }),
        onInitializationFailed: (error) => {
          console.error("[TossAds] init failed:", error);
          setState({ status: "failed", error });
        },
      },
    });
  } catch (error) {
    // SDK 호출 자체가 throw하는 환경 (브라우저 미리보기 등)
    console.warn("[TossAds] not available in this environment", error);
    setState({ status: "unsupported" });
  }
}

/**
 * 토스 광고 SDK 초기화 상태를 구독한다.
 * - 앱 최상위에서 한 번 호출하면 충분하지만, 어디서든 안전하게 여러 번 호출 가능 (싱글톤)
 * - `status === "ready"` 일 때만 광고 부착이 의미 있음
 * - `unsupported` 또는 `failed`면 광고 영역을 숨겨 빈 박스 노출 방지
 */
export function useTossAds(): TossAdsState {
  const [state, setStateLocal] = useState<TossAdsState>(currentState);

  useEffect(() => {
    initializeOnce();
    const listener = (next: TossAdsState) => setStateLocal(next);
    initListeners.push(listener);
    setStateLocal(currentState);

    return () => {
      initListeners = initListeners.filter((l) => l !== listener);
    };
  }, []);

  return state;
}
