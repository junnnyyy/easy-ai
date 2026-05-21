import { useState } from "react";
import { FixedBottomCTA, SegmentedControl } from "@toss/tds-mobile";
import { NavBar } from "../components/NavBar";
import { AdBanner } from "../components/AdBanner";
import type { AskParams } from "../hooks/useAskAI";

type CalendarType = "양력" | "음력";
type Gender = "남자" | "여자" | "선택 안 함";

const today = new Date();
const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

type Props = {
  onAsk: (params: AskParams) => void;
  onBack: () => void;
  errorMessage: string | null;
};

export function YunseInputScreen({ onAsk, onBack, errorMessage }: Props) {
  const [calendarType, setCalendarType] = useState<CalendarType>("양력");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [gender, setGender] = useState<Gender>("선택 안 함");
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    const y = Number(year), m = Number(month), d = Number(day);
    if (!year) return "태어난 연도를 입력해 주세요.";
    if (y < 1900 || y > new Date().getFullYear()) return "올바른 연도를 입력해 주세요.";
    if (!month) return "태어난 월을 입력해 주세요.";
    if (m < 1 || m > 12) return "월은 1~12 사이로 입력해 주세요.";
    if (!day) return "태어난 일을 입력해 주세요.";
    if (d < 1 || d > 31) return "일은 1~31 사이로 입력해 주세요.";
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    const parts = [
      `오늘 날짜: ${todayStr}`,
      `생년월일: ${year}년 ${month}월 ${day}일 (${calendarType})`,
      gender !== "선택 안 함" ? `성별: ${gender}` : null,
    ].filter(Boolean);
    onAsk({ requestType: "yunse", message: parts.join(" / ") });
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      <NavBar title="오늘의 운세" onBack={onBack} />

      <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* 오늘 날짜 배지 */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#EEF2FF",
          borderRadius: 20,
          padding: "8px 14px",
          alignSelf: "flex-start",
        }}>
          <span style={{ fontSize: 15 }}>📅</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#3366FF" }}>{todayStr} 운세</span>
        </div>

        <p style={{ fontSize: 15, color: "#555", margin: 0, lineHeight: 1.6 }}>
          생년월일을 입력하면 오늘 하루 운세를 봐드려요.
        </p>

        {(error || errorMessage) && (
          <p style={{ color: "#E52222", fontSize: 14, margin: 0 }}>{error ?? errorMessage}</p>
        )}

        {/* 생년월일 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>생년월일</p>
            <span style={{ fontSize: 12, color: "#3366FF", fontWeight: 600 }}>필수</span>
          </div>
          <div style={{
            background: "#F8F9FA",
            borderRadius: 14,
            border: error ? "1.5px solid #E52222" : "1.5px solid #EBEBEB",
          }}>
            <div style={{ padding: "12px 14px 8px" }}>
              <SegmentedControl
                value={calendarType}
                onChange={(v) => setCalendarType(v as CalendarType)}
              >
                <SegmentedControl.Item value="양력">양력</SegmentedControl.Item>
                <SegmentedControl.Item value="음력">음력</SegmentedControl.Item>
              </SegmentedControl>
            </div>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 14px 14px", gap: 6 }}>
              <DateInput placeholder="1965" value={year} onChange={(v) => { setYear(v); setError(null); }} maxLength={4} style={{ flex: 2 }} />
              <span style={{ fontSize: 15, color: "#555", flexShrink: 0 }}>년</span>
              <DateInput placeholder="3" value={month} onChange={(v) => { setMonth(v); setError(null); }} maxLength={2} style={{ flex: 1 }} />
              <span style={{ fontSize: 15, color: "#555", flexShrink: 0 }}>월</span>
              <DateInput placeholder="15" value={day} onChange={(v) => { setDay(v); setError(null); }} maxLength={2} style={{ flex: 1 }} />
              <span style={{ fontSize: 15, color: "#555", flexShrink: 0 }}>일</span>
            </div>
          </div>
        </div>

        {/* 성별 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>성별</p>
            <span style={{ fontSize: 12, color: "#999" }}>선택 사항이에요.</span>
          </div>
          <SegmentedControl value={gender} onChange={(v) => setGender(v as Gender)}>
            <SegmentedControl.Item value="남자">남자</SegmentedControl.Item>
            <SegmentedControl.Item value="여자">여자</SegmentedControl.Item>
            <SegmentedControl.Item value="선택 안 함">선택 안 함</SegmentedControl.Item>
          </SegmentedControl>
        </div>

        {/* 입력 요약 */}
        {year && month && day && (
          <div style={{
            background: "#F0F4FF",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#3366CC", margin: 0 }}>📋 입력 요약</p>
            <p style={{ fontSize: 13, color: "#444", margin: 0, lineHeight: 1.7 }}>
              {year}년 {month}월 {day}일 ({calendarType}) ·{" "}
              {gender === "선택 안 함" ? "성별 미입력" : gender}
            </p>
          </div>
        )}

        <AdBanner />
      </div>

      <FixedBottomCTA onClick={handleSubmit}>
        광고 보고 운세 보기
      </FixedBottomCTA>
    </div>
  );
}

function DateInput({
  placeholder, value, onChange, maxLength, style,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  style?: React.CSSProperties;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(e) => { if (e.target.value.length <= maxLength) onChange(e.target.value); }}
      style={{
        padding: "10px 8px",
        fontSize: 17,
        fontWeight: 600,
        border: "none",
        background: "transparent",
        color: "#111",
        outline: "none",
        textAlign: "center",
        width: "100%",
        boxSizing: "border-box",
        MozAppearance: "textfield",
        ...style,
      }}
    />
  );
}
