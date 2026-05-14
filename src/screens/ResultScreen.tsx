import { Button, FixedBottomCTA, useToast } from "@toss/tds-mobile";
import { NavBar } from "../components/NavBar";
import { AdBanner } from "../components/AdBanner";

type Props = {
  answer: string;
  onBack: () => void;
  onReset: () => void;
};

export function ResultScreen({ answer, onBack, onReset }: Props) {
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer);
      toast.openToast("복사했어요.", { icon: "icon-check", iconType: "circle" });
    } catch {
      toast.openToast("복사에 실패했어요. 텍스트를 직접 선택해 주세요.");
    }
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      <NavBar title="AI 답변" onBack={onBack} />

      <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>
        <div
          style={{
            background: "#F8F8F8",
            borderRadius: 12,
            padding: "20px",
            lineHeight: 1.7,
            fontSize: 17,
            whiteSpace: "pre-wrap",
            wordBreak: "keep-all",
          }}
        >
          {answer}
        </div>

        <Button variant="weak" size="medium" onClick={handleCopy}>
          복사하기
        </Button>

        <p style={{ fontSize: 13, color: "#888", textAlign: "center", margin: 0 }}>
          AI 답변은 참고용이에요. 의료·법률·금융 관련 내용은 전문가에게 확인해 주세요.
        </p>
      </div>

      <AdBanner />

      <FixedBottomCTA>
        <Button size="xlarge" onClick={onReset}>
          다시 질문하기
        </Button>
      </FixedBottomCTA>
    </div>
  );
}
