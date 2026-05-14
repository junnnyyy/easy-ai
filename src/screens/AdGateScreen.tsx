import { Button, FixedBottomCTA, useToast } from "@toss/tds-mobile";
import { useState } from "react";
import { NavBar } from "../components/NavBar";
import { api } from "../api/client";
import { useRewardedAd } from "../hooks/useRewardedAd";
import { useUserKey } from "../hooks/useUserKey";

type Props = {
  onRewardIssued: (rewardId: string) => void; // rewardId 발급 성공 → App에서 ai-chat 재호출
  onBack: () => void;
};

export function AdGateScreen({ onRewardIssued, onBack }: Props) {
  const toast = useToast();
  const userKeyState = useUserKey();
  const { showAd, status: adStatus } = useRewardedAd();
  const [busy, setBusy] = useState(false);

  const handleWatchAd = async () => {
    if (busy) return;
    if (userKeyState.status !== "ready") {
      toast.openToast("사용자 정보를 불러올 수 없어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setBusy(true);
    try {
      const nonce = crypto.randomUUID();
      const result = await showAd();

      if (!result.ok) {
        if (result.reason === "dismissed") {
          toast.openToast("광고를 끝까지 봐야 답변을 받을 수 있어요.");
        } else if (result.reason === "unsupported" || result.reason === "no-id") {
          toast.openToast("이 환경에서는 광고를 볼 수 없어요. 내일 다시 이용해 주세요.");
        } else {
          toast.openToast("광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        return;
      }

      // 광고 완료 → Edge Function에서 rewardId 발급
      const rewardRes = await api.issueAdReward({
        deviceId: userKeyState.userKey,
        nonce,
      });

      if (!rewardRes.ok) {
        toast.openToast("보상 발급에 실패했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }

      onRewardIssued(rewardRes.data.rewardId);
    } finally {
      setBusy(false);
    }
  };

  const buttonLabel =
    adStatus === "loading" ? "광고 불러오는 중…" :
    adStatus === "showing" ? "광고 재생 중…" :
    busy ? "잠시만요…" :
    "광고 보고 답변 받기";

  return (
    <div style={{ paddingBottom: 120 }}>
      <NavBar title="광고 보고 계속하기" onBack={onBack} />

      <div
        style={{
          padding: "40px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
          오늘 무료 사용을<br />모두 쓰셨어요
        </p>
        <p style={{ fontSize: 15, color: "#555", margin: 0, lineHeight: 1.6 }}>
          AI 답변을 만들기 위해<br />광고를 한 번 시청해 주세요.<br />
          광고를 끝까지 보면 답변이 바로 생성돼요.
        </p>
        <p style={{ fontSize: 13, color: "#999", margin: 0 }}>
          개인정보나 비밀번호는 입력하지 마세요.
        </p>
      </div>

      <FixedBottomCTA>
        <Button size="xlarge" onClick={handleWatchAd} disabled={busy}>
          {buttonLabel}
        </Button>
      </FixedBottomCTA>
    </div>
  );
}
