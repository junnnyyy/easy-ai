import { useState } from "react";
import { useToast } from "@toss/tds-mobile";
import { useAskAI, type AskParams } from "./hooks/useAskAI";
import { useUserKey } from "./hooks/useUserKey";
import { useRewardedAd } from "./hooks/useRewardedAd";
import { api } from "./api/client";
import { HomeScreen } from "./screens/HomeScreen";
import { FeatureInputScreen } from "./screens/FeatureInputScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { FEATURE_CONFIGS, type FeatureConfig } from "./features/featureConfigs";

type Screen =
  | { name: "home" }
  | { name: "feature"; config: FeatureConfig }
  | { name: "result" };

export default function App() {
  const toast = useToast();
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const { ask, status, answer, error, reset } = useAskAI();
  const userKeyState = useUserKey();
  const { showAd, status: adStatus } = useRewardedAd();
  const [adBusy, setAdBusy] = useState(false);

  // 버튼 한 번으로: 광고 시청 → rewardId 발급 → AI 호출 → 결과 화면.
  const handleAsk = async (params: AskParams) => {
    if (adBusy || status === "loading") return;
    if (userKeyState.status !== "ready") {
      toast.openToast("사용자 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setAdBusy(true);
    try {
      // 1) 광고 시청
      const nonce = crypto.randomUUID();
      const adResult = await showAd();

      if (!adResult.ok) {
        if (adResult.reason === "dismissed") {
          toast.openToast("광고를 끝까지 봐야 답변을 받을 수 있어요.");
        } else if (adResult.reason === "unsupported" || adResult.reason === "no-id") {
          toast.openToast("이 환경에서는 광고를 볼 수 없어요.");
        } else {
          toast.openToast("광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        return;
      }

      // 2) rewardId 발급
      const rewardRes = await api.issueAdReward({
        deviceId: userKeyState.userKey,
        nonce,
      });
      if (!rewardRes.ok) {
        toast.openToast("보상 발급에 실패했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      // 3) AI 호출
      const result = await ask({ ...params, rewardId: rewardRes.data.rewardId });
      if (result.ok) {
        setScreen({ name: "result" });
      } else {
        toast.openToast(result.error.message);
      }
    } finally {
      setAdBusy(false);
    }
  };

  const handleFeatureSelect = (key: FeatureConfig["key"]) => {
    reset();
    setScreen({ name: "feature", config: FEATURE_CONFIGS[key] });
  };

  const handleBack = () => {
    reset();
    setScreen({ name: "home" });
  };

  const handleReset = () => {
    reset();
    setScreen({ name: "home" });
  };

  // 광고 노출/AI 호출 진행 중에는 로딩 화면.
  const isLoading =
    status === "loading" || adBusy || adStatus === "loading" || adStatus === "showing";
  if (isLoading) {
    return <LoadingScreen />;
  }

  if (screen.name === "result" && answer) {
    return <ResultScreen answer={answer} onBack={handleBack} onReset={handleReset} />;
  }

  if (screen.name === "feature") {
    return (
      <FeatureInputScreen
        config={screen.config}
        onAsk={handleAsk}
        onBack={handleBack}
        errorMessage={error?.message ?? null}
      />
    );
  }

  return (
    <HomeScreen
      onAsk={handleAsk}
      onFeatureSelect={handleFeatureSelect}
      errorMessage={error?.message ?? null}
    />
  );
}
