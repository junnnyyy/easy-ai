import { FixedBottomCTA, TextArea } from "@toss/tds-mobile";
import { useState } from "react";
import type { AskParams } from "../hooks/useAskAI";
import type { FeatureConfig } from "../features/featureConfigs";
import { FEATURE_CONFIGS } from "../features/featureConfigs";
import { AdBanner } from "../components/AdBanner";

const MAX_LENGTH = 1000;

type Props = {
  onAsk: (params: AskParams) => void;
  onFeatureSelect: (key: FeatureConfig["key"]) => void;
  errorMessage: string | null;
};

export function HomeScreen({ onAsk, onFeatureSelect, errorMessage }: Props) {
  const [message, setMessage] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setValidationError("질문을 입력해 주세요.");
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setValidationError(`${MAX_LENGTH}자 이내로 입력해 주세요.`);
      return;
    }
    setValidationError(null);
    onAsk({ requestType: "free_chat", message: trimmed });
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: "28px 20px 16px" }}>
        <p style={{ fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>쉬운 AI</p>
        <p style={{ fontSize: 16, color: "#555", margin: 0, lineHeight: 1.5 }}>
          어려운 말도 쉽게,<br />궁금한 것도 바로 물어보세요.
        </p>
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 24 }}>
        {(errorMessage || validationError) && (
          <p style={{ color: "#E52222", fontSize: 14, margin: 0 }}>
            {validationError ?? errorMessage}
          </p>
        )}

        <div>
          <TextArea
            variant="box"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder="궁금한 것을 무엇이든 물어보세요."
            minHeight={120}
            help={
              message.length > MAX_LENGTH
                ? `${MAX_LENGTH}자 이내로 입력해 주세요.`
                : `${message.length} / ${MAX_LENGTH}`
            }
            hasError={message.length > MAX_LENGTH || !!validationError}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            주민번호, 카드번호, 계좌번호 등 개인정보는 입력하지 마세요.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>자주 쓰는 기능</p>
          {(Object.values(FEATURE_CONFIGS) as FeatureConfig[]).map((config) => (
            <FeatureCard
              key={config.key}
              config={config}
              onSelect={() => onFeatureSelect(config.key)}
            />
          ))}
        </div>
      </div>

      <AdBanner />

      <FixedBottomCTA
        onClick={handleSubmit}
        disabled={message.length > MAX_LENGTH}
      >
        광고 보고 AI에게 질문하기
      </FixedBottomCTA>
    </div>
  );
}

function FeatureCard({
  config,
  onSelect,
}: {
  config: FeatureConfig;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "16px",
        borderRadius: 12,
        border: "1px solid #E8E8E8",
        background: "#fff",
        textAlign: "left",
        cursor: "pointer",
        minHeight: 64,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 600 }}>{config.title}</span>
      <span style={{ fontSize: 13, color: "#666" }}>{config.description}</span>
    </button>
  );
}
