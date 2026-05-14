import { Button, FixedBottomCTA, SegmentedControl, TextArea, useToast } from "@toss/tds-mobile";
import { useState } from "react";
import type { AskParams } from "../hooks/useAskAI";
import type { FeatureConfig } from "../features/featureConfigs";
import { TONE_OPTIONS } from "../features/featureConfigs";
import type { Tone } from "../api/client";
import { NavBar } from "../components/NavBar";
import { AdBanner } from "../components/AdBanner";

const MAX_LENGTH = 1000;

type Props = {
  config: FeatureConfig;
  onAsk: (params: AskParams) => void;
  onBack: () => void;
  errorMessage: string | null;
};

export function FeatureInputScreen({ config, onAsk, onBack, errorMessage }: Props) {
  const toast = useToast();
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<Tone>("formal");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.openToast("클립보드에 붙여넣을 내용이 없어요.");
        return;
      }
      setMessage(text);
      setValidationError(null);
      toast.openToast("클립보드 내용을 붙여넣었어요.");
    } catch {
      toast.openToast("붙여넣기에 실패했어요. 직접 입력해 주세요.");
    }
  };

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setValidationError("내용을 입력해 주세요.");
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setValidationError(`${MAX_LENGTH}자 이내로 입력해 주세요.`);
      return;
    }
    setValidationError(null);
    onAsk({
      requestType: config.requestType,
      message: trimmed,
      tone: config.hasTone ? tone : undefined,
    });
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <NavBar title={config.title} onBack={onBack} />

      <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 15, color: "#444", margin: 0 }}>{config.description}</p>

        {(errorMessage || validationError) && (
          <p style={{ color: "#E52222", fontSize: 14, margin: 0 }}>
            {validationError ?? errorMessage}
          </p>
        )}

        {config.hasTone && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>말투 선택</p>
            <SegmentedControl
              value={tone}
              onChange={(v) => setTone(v as Tone)}
            >
              {TONE_OPTIONS.map((opt) => (
                <SegmentedControl.Item key={opt.value} value={opt.value}>
                  {opt.label}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>예시 선택</p>
            {config.requestType === "spam_check" && (
              <Button variant="weak" size="small" onClick={handlePaste}>
                붙여넣기
              </Button>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {config.examples.map((ex) => (
              <button
                key={ex}
                onClick={() => { setMessage(ex); setValidationError(null); }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 20,
                  border: "1px solid #E8E8E8",
                  background: "#F5F5F5",
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  maxWidth: "100%",
                }}
              >
                {ex.length > 30 ? ex.slice(0, 30) + "…" : ex}
              </button>
            ))}
          </div>
        </div>

        <TextArea
          variant="box"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (validationError) setValidationError(null);
          }}
          placeholder={config.placeholder}
          minHeight={140}
          help={
            message.length > MAX_LENGTH
              ? `${MAX_LENGTH}자 이내로 입력해 주세요.`
              : `${message.length} / ${MAX_LENGTH}`
          }
          hasError={message.length > MAX_LENGTH || !!validationError}
        />

        <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
          주민번호, 카드번호, 계좌번호 등 개인정보는 입력하지 마세요.
        </p>
      </div>

      <AdBanner />

      <FixedBottomCTA>
        <Button
          size="xlarge"
          onClick={handleSubmit}
          disabled={message.length > MAX_LENGTH}
        >
          AI에게 물어보기
        </Button>
      </FixedBottomCTA>
    </div>
  );
}
