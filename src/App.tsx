import { useState } from "react";
import { useToast } from "@toss/tds-mobile";
import { useAskAI, type AskParams } from "./hooks/useAskAI";
import { useUserKey } from "./hooks/useUserKey";
import { useRewardedAd } from "./hooks/useRewardedAd";
import { api } from "./api/client";
import { HomeScreen } from "./screens/HomeScreen";
import { FeatureInputScreen } from "./screens/FeatureInputScreen";
import { SajuInputScreen } from "./screens/SajuInputScreen";
import { YunseInputScreen } from "./screens/YunseInputScreen";
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

  // free_count 먼저 소진 → 부족하면 광고 시청 후 재호출
  const handleAsk = async (params: AskParams) => {
    if (adBusy || status === "loading") return;
    if (userKeyState.status !== "ready") {
      toast.openToast("사용자 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    // 1) rewardId 없이 먼저 호출 (free_count 사용)
    const firstResult = await ask(params);
    if (firstResult.ok) {
      setScreen({ name: "result" });
        window.scrollTo(0, 0);
      return;
    }

    // free_count 부족한 경우에만 광고 진행
    if (firstResult.error.code !== "AD_REQUIRED") {
      toast.openToast(firstResult.error.message);
      return;
    }

    // 2) 광고 시청
    setAdBusy(true);
    try {
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

      // 3) rewardId 발급
      const rewardRes = await api.issueAdReward({
        deviceId: userKeyState.userKey,
        nonce,
      });
      if (!rewardRes.ok) {
        toast.openToast("보상 발급에 실패했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      // 4) rewardId 포함해서 재호출
      const result = await ask({ ...params, rewardId: rewardRes.data.rewardId });
      if (result.ok) {
        setScreen({ name: "result" });
        window.scrollTo(0, 0);
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
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    reset();
    setScreen({ name: "home" });
    window.scrollTo(0, 0);
  };

  const handleReset = () => {
    reset();
    setScreen({ name: "home" });
    window.scrollTo(0, 0);
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
    if (screen.config.key === "saju") {
      return (
        <SajuInputScreen
          onAsk={handleAsk}
          onBack={handleBack}
          errorMessage={error?.message ?? null}
        />
      );
    }
    if (screen.config.key === "yunse") {
      return (
        <YunseInputScreen
          onAsk={handleAsk}
          onBack={handleBack}
          errorMessage={error?.message ?? null}
        />
      );
    }
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
