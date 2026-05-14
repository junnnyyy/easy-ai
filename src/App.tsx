import { useState } from "react";
import { useAskAI, type AskParams } from "./hooks/useAskAI";
import { HomeScreen } from "./screens/HomeScreen";
import { FeatureInputScreen } from "./screens/FeatureInputScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { LoadingScreen } from "./screens/LoadingScreen";
import { AdGateScreen } from "./screens/AdGateScreen";
import { FEATURE_CONFIGS, type FeatureConfig } from "./features/featureConfigs";

type Screen =
  | { name: "home" }
  | { name: "feature"; config: FeatureConfig }
  | { name: "adGate"; pendingParams: AskParams }
  | { name: "result" };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const { ask, status, answer, error, reset } = useAskAI();

  const handleAsk = async (params: AskParams) => {
    const result = await ask(params);
    if (result.ok) {
      setScreen({ name: "result" });
      return;
    }
    if (result.error.code === "AD_REQUIRED") {
      setScreen({ name: "adGate", pendingParams: params });
    }
  };

  // AdGate에서 광고 시청 + rewardId 발급 완료 후 호출됨
  const handleRewardIssued = async (rewardId: string) => {
    if (screen.name !== "adGate") return;
    const { pendingParams } = screen;
    const result = await ask({ ...pendingParams, rewardId });
    if (result.ok) {
      setScreen({ name: "result" });
    } else {
      // 광고 후에도 실패한 경우 (예: AD_REWARD_INVALID) — Home으로 폴백
      setScreen({ name: "home" });
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

  if (status === "loading") {
    return <LoadingScreen />;
  }

  if (screen.name === "result" && answer) {
    return <ResultScreen answer={answer} onBack={handleBack} onReset={handleReset} />;
  }

  if (screen.name === "adGate") {
    return <AdGateScreen onBack={handleBack} onRewardIssued={handleRewardIssued} />;
  }

  if (screen.name === "feature") {
    return (
      <FeatureInputScreen
        config={screen.config}
        onAsk={handleAsk}
        onBack={handleBack}
        errorMessage={error && error.code !== "AD_REQUIRED" ? error.message : null}
      />
    );
  }

  return (
    <HomeScreen
      onAsk={handleAsk}
      onFeatureSelect={handleFeatureSelect}
      errorMessage={error && error.code !== "AD_REQUIRED" ? error.message : null}
    />
  );
}
