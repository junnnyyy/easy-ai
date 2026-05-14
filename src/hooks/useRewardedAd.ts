import { loadFullScreenAd, showFullScreenAd } from "@apps-in-toss/web-framework";
import { useCallback, useRef, useState } from "react";

const REWARDED_AD_GROUP_ID = import.meta.env.VITE_AIT_REWARDED_AD_GROUP_ID as string;

export type RewardedAdStatus = "idle" | "loading" | "ready" | "showing" | "completed" | "failed";

export type RewardedResult =
  | { ok: true } // userEarnedReward 이벤트 수신
  | { ok: false; reason: "dismissed" | "failed" | "unsupported" | "no-id" };

/**
 * 보상형 전면 광고 시청 흐름을 1회성 Promise로 제공.
 * - `showAd()` 호출 시 load → show 순으로 동작
 * - `userEarnedReward` 이벤트 수신 시에만 `{ ok: true }` resolve
 * - 닫기/실패는 `{ ok: false }`로 resolve (reject 대신 — 호출부 try/catch 강제 회피)
 */
export function useRewardedAd() {
  const [status, setStatus] = useState<RewardedAdStatus>("idle");
  const inFlight = useRef(false);

  const showAd = useCallback(async (): Promise<RewardedResult> => {
    if (inFlight.current) {
      return { ok: false, reason: "failed" };
    }
    if (!REWARDED_AD_GROUP_ID) {
      console.warn("[Ad] REWARDED_AD_GROUP_ID is not set");
      return { ok: false, reason: "no-id" };
    }
    if (!loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) {
      return { ok: false, reason: "unsupported" };
    }

    inFlight.current = true;
    setStatus("loading");

    return new Promise<RewardedResult>((resolve) => {
      let resolved = false;
      const finish = (result: RewardedResult, nextStatus: RewardedAdStatus) => {
        if (resolved) return;
        resolved = true;
        setStatus(nextStatus);
        inFlight.current = false;
        resolve(result);
      };

      // 1) 광고 로드
      const unsubLoad = loadFullScreenAd({
        options: { adGroupId: REWARDED_AD_GROUP_ID },
        onEvent: (data) => {
          if (data.type !== "loaded") return;
          setStatus("ready");
          unsubLoad();

          // 2) 광고 노출
          setStatus("showing");
          let earnedReward = false;
          const unsubShow = showFullScreenAd({
            options: { adGroupId: REWARDED_AD_GROUP_ID },
            onEvent: (event) => {
              switch (event.type) {
                case "userEarnedReward":
                  earnedReward = true;
                  break;
                case "dismissed":
                  unsubShow();
                  if (earnedReward) {
                    finish({ ok: true }, "completed");
                  } else {
                    finish({ ok: false, reason: "dismissed" }, "idle");
                  }
                  break;
                case "failedToShow":
                  unsubShow();
                  finish({ ok: false, reason: "failed" }, "failed");
                  break;
              }
            },
            onError: (err) => {
              console.error("[Ad] showFullScreenAd error:", err);
              unsubShow();
              finish({ ok: false, reason: "failed" }, "failed");
            },
          });
        },
        onError: (err) => {
          console.error("[Ad] loadFullScreenAd error:", err);
          unsubLoad();
          finish({ ok: false, reason: "failed" }, "failed");
        },
      });
    });
  }, []);

  return { showAd, status };
}
