import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef } from "react";
import { useTossAds } from "../hooks/useTossAds";

const BANNER_AD_GROUP_ID = import.meta.env.VITE_AIT_BANNER_AD_GROUP_ID as string;
const BANNER_HEIGHT = 96; // 고정형 권장 높이 (docs/ait-ads-banner.md)

/**
 * 화면 하단에 노출되는 인앱 배너 광고.
 * - 토스앱 5.241.0+ 에서만 동작, 미지원/실패 시 영역 hide (레이아웃 보존)
 * - 컴포넌트 언마운트 시 `destroy()` 호출
 */
export function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sdk = useTossAds();

  useEffect(() => {
    if (sdk.status !== "ready" || !containerRef.current || !BANNER_AD_GROUP_ID) {
      return;
    }

    const attached = TossAds.attachBanner(BANNER_AD_GROUP_ID, containerRef.current, {
      theme: "auto",
      tone: "grey",
      variant: "expanded",
      callbacks: {
        onAdRendered: (payload) => console.log("[Ad] banner rendered:", payload.slotId),
        onAdImpression: (payload) => console.log("[Ad] banner impression:", payload.slotId),
        onAdClicked: (payload) => console.log("[Ad] banner clicked:", payload.slotId),
        onNoFill: (payload) => console.warn("[Ad] banner no-fill:", payload.slotId),
        onAdFailedToRender: (payload) => console.error("[Ad] banner failed:", payload.error.message),
      },
    });

    return () => {
      attached?.destroy();
    };
  }, [sdk.status]);

  // SDK가 unsupported/failed면 영역 자체를 그려서 placeholder 보존
  if (sdk.status === "unsupported" || sdk.status === "failed") {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: BANNER_HEIGHT,
        margin: "12px 0",
      }}
    />
  );
}
