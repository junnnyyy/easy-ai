import { Loader } from "@toss/tds-mobile";
import { useEffect, useState } from "react";

export function LoadingScreen() {
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowExtra(true), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100dvh",
        gap: "20px",
        padding: "24px",
      }}
    >
      <Loader size="large" />
      <p style={{ fontSize: 17, textAlign: "center", margin: 0 }}>
        답변을 만들고 있어요.
      </p>
      {showExtra && (
        <p style={{ fontSize: 14, textAlign: "center", color: "#888", margin: 0 }}>
          조금만 더 기다려 주세요.
        </p>
      )}
    </div>
  );
}
