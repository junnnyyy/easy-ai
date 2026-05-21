import { Button, FixedBottomCTA, useToast } from "@toss/tds-mobile";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
            wordBreak: "keep-all",
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p style={{ margin: "0 0 10px" }}>{children}</p>,
              strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
              ul: ({ children }) => <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>{children}</ul>,
              ol: ({ children }) => <ol style={{ margin: "0 0 10px", paddingLeft: 20 }}>{children}</ol>,
              li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
              h1: ({ children }) => <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>{children}</h1>,
              h2: ({ children }) => <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{children}</h2>,
              h3: ({ children }) => <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>{children}</h3>,
              table: ({ children }) => (
                <div style={{ overflowX: "auto", marginBottom: 10 }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 15 }}>{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th style={{ border: "1px solid #ddd", padding: "6px 10px", background: "#efefef", fontWeight: 700, textAlign: "left" }}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td style={{ border: "1px solid #ddd", padding: "6px 10px" }}>{children}</td>
              ),
              code: ({ children }) => (
                <code style={{ background: "#e8e8e8", borderRadius: 4, padding: "1px 5px", fontSize: 14 }}>{children}</code>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{ borderLeft: "3px solid #ccc", margin: "0 0 10px", paddingLeft: 12, color: "#555" }}>
                  {children}
                </blockquote>
              ),
            }}
          >
            {answer}
          </ReactMarkdown>
        </div>

        <Button variant="weak" size="medium" onClick={handleCopy}>
          복사하기
        </Button>

        <p style={{ fontSize: 13, color: "#888", textAlign: "center", margin: 0 }}>
          AI 답변은 참고용이에요. 의료·법률·금융 관련 내용은 전문가에게 확인해 주세요.
        </p>
      </div>

      <AdBanner />

      <FixedBottomCTA onClick={onReset}>
        다시 질문하기
      </FixedBottomCTA>
    </div>
  );
}
