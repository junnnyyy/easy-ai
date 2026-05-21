import { useState } from "react";
import { FixedBottomCTA, SegmentedControl } from "@toss/tds-mobile";
import { NavBar } from "../components/NavBar";
import { AdBanner } from "../components/AdBanner";
import type { AskParams } from "../hooks/useAskAI";

type CalendarType = "양력" | "음력";
type Gender = "남자" | "여자" | "선택 안 함";

const BIRTH_TIMES: { label: string; sub: string; value: string }[] = [
  { label: "모름", sub: "", value: "모름" },
  { label: "자시", sub: "23–01시", value: "자시(23:00~01:00)" },
  { label: "축시", sub: "01–03시", value: "축시(01:00~03:00)" },
  { label: "인시", sub: "03–05시", value: "인시(03:00~05:00)" },
  { label: "묘시", sub: "05–07시", value: "묘시(05:00~07:00)" },
  { label: "진시", sub: "07–09시", value: "진시(07:00~09:00)" },
  { label: "사시", sub: "09–11시", value: "사시(09:00~11:00)" },
  { label: "오시", sub: "11–13시", value: "오시(11:00~13:00)" },
  { label: "미시", sub: "13–15시", value: "미시(13:00~15:00)" },
  { label: "신시", sub: "15–17시", value: "신시(15:00~17:00)" },
  { label: "유시", sub: "17–19시", value: "유시(17:00~19:00)" },
  { label: "술시", sub: "19–21시", value: "술시(19:00~21:00)" },
  { label: "해시", sub: "21–23시", value: "해시(21:00~23:00)" },
];

const REGIONS = [
  "서울", "경기", "인천", "강원",
  "충북", "충남", "대전", "세종",
  "전북", "전남", "광주",
  "경북", "경남", "대구", "울산", "부산",
  "제주", "해외",
];

type Props = {
  onAsk: (params: AskParams) => void;
  onBack: () => void;
  errorMessage: string | null;
};

export function SajuInputScreen({ onAsk, onBack, errorMessage }: Props) {
  const [calendarType, setCalendarType] = useState<CalendarType>("양력");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [birthTime, setBirthTime] = useState("모름");
  const [gender, setGender] = useState<Gender>("선택 안 함");
  const [region, setRegion] = useState("서울");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);

    if (!year) next.date = "태어난 연도를 입력해 주세요.";
    else if (y < 1900 || y > new Date().getFullYear()) next.date = "올바른 연도를 입력해 주세요.";
    else if (!month) next.date = "태어난 월을 입력해 주세요.";
    else if (m < 1 || m > 12) next.date = "월은 1~12 사이로 입력해 주세요.";
    else if (!day) next.date = "태어난 일을 입력해 주세요.";
    else if (d < 1 || d > 31) next.date = "일은 1~31 사이로 입력해 주세요.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const parts = [
      `${year}년 ${month}월 ${day}일 (${calendarType})`,
      birthTime === "모름" ? "생시 모름" : `생시 ${birthTime}`,
      gender !== "선택 안 함" ? gender : null,
      `출생 지역 ${region}`,
    ].filter(Boolean);
    onAsk({ requestType: "saju", message: parts.join(", ") });
  };

  return (
    <div style={{ paddingBottom: 120 }}>
      <NavBar title="사주 보기" onBack={onBack} />

      <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 28 }}>
        <p style={{ fontSize: 15, color: "#555", margin: 0, lineHeight: 1.6 }}>
          생년월일을 입력하면 사주를 풀어드려요.<br />
          <span style={{ fontSize: 13, color: "#999" }}>생시·성별·지역을 추가하면 더 정확해요.</span>
        </p>

        {errorMessage && (
          <p style={{ color: "#E52222", fontSize: 14, margin: 0 }}>{errorMessage}</p>
        )}

        {/* 생년월일 */}
        <Section label="생년월일" required>
          <div
            style={{
              background: "#F8F9FA",
              borderRadius: 14,
              border: errors.date ? "1.5px solid #E52222" : "1.5px solid #EBEBEB",
              overflow: "hidden",
            }}
          >
            {/* 양력/음력 탭 */}
            <div style={{ padding: "12px 14px 8px" }}>
              <SegmentedControl
                value={calendarType}
                onChange={(v) => setCalendarType(v as CalendarType)}
              >
                <SegmentedControl.Item value="양력">양력</SegmentedControl.Item>
                <SegmentedControl.Item value="음력">음력</SegmentedControl.Item>
              </SegmentedControl>
            </div>

            {/* 날짜 입력 */}
            <div style={{ display: "flex", alignItems: "center", padding: "8px 14px 14px", gap: 6 }}>
              <DateInput
                placeholder="1965"
                value={year}
                onChange={(v) => { setYear(v); setErrors({}); }}
                maxLength={4}
                style={{ flex: 2 }}
              />
              <span style={{ fontSize: 15, color: "#555", flexShrink: 0 }}>년</span>
              <DateInput
                placeholder="3"
                value={month}
                onChange={(v) => { setMonth(v); setErrors({}); }}
                maxLength={2}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 15, color: "#555", flexShrink: 0 }}>월</span>
              <DateInput
                placeholder="15"
                value={day}
                onChange={(v) => { setDay(v); setErrors({}); }}
                maxLength={2}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 15, color: "#555", flexShrink: 0 }}>일</span>
            </div>
          </div>
          {errors.date && (
            <p style={{ color: "#E52222", fontSize: 13, margin: "4px 0 0" }}>{errors.date}</p>
          )}
        </Section>

        {/* 생시 */}
        <Section label="생시" hint="모르시면 '모름'을 선택해 주세요.">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {BIRTH_TIMES.map((t) => {
              const selected = birthTime === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setBirthTime(t.value)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 4px",
                    borderRadius: 12,
                    border: selected ? "2px solid #3366FF" : "1.5px solid #EBEBEB",
                    background: selected ? "#EEF2FF" : "#F8F9FA",
                    cursor: "pointer",
                    gap: 2,
                    minHeight: 56,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: selected ? 700 : 500, color: selected ? "#3366FF" : "#333" }}>
                    {t.label}
                  </span>
                  {t.sub && (
                    <span style={{ fontSize: 10, color: selected ? "#3366FF" : "#999", lineHeight: 1.2 }}>
                      {t.sub}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* 성별 */}
        <Section label="성별" hint="선택 사항이에요.">
          <SegmentedControl
            value={gender}
            onChange={(v) => setGender(v as Gender)}
          >
            <SegmentedControl.Item value="남자">남자</SegmentedControl.Item>
            <SegmentedControl.Item value="여자">여자</SegmentedControl.Item>
            <SegmentedControl.Item value="선택 안 함">선택 안 함</SegmentedControl.Item>
          </SegmentedControl>
        </Section>

        {/* 출생 지역 */}
        <Section label="출생 지역">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {REGIONS.map((r) => {
              const selected = region === r;
              return (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: selected ? "2px solid #3366FF" : "1.5px solid #EBEBEB",
                    background: selected ? "#EEF2FF" : "#F8F9FA",
                    fontSize: 14,
                    fontWeight: selected ? 700 : 400,
                    color: selected ? "#3366FF" : "#444",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </Section>

        {/* 입력 요약 */}
        {year && month && day && (
          <div
            style={{
              background: "#F0F4FF",
              borderRadius: 12,
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: "#3366CC", margin: 0 }}>📋 입력 요약</p>
            <p style={{ fontSize: 13, color: "#444", margin: 0, lineHeight: 1.7 }}>
              {year}년 {month}월 {day}일 ({calendarType})<br />
              {birthTime === "모름" ? "생시 모름" : `생시 ${BIRTH_TIMES.find(t => t.value === birthTime)?.label}`}
              {" · "}
              {gender === "선택 안 함" ? "성별 미입력" : gender}
              {" · "}
              {region}
            </p>
          </div>
        )}

        <div
          style={{
            background: "#FFF8E6",
            border: "1.5px solid #F5A623",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 13, color: "#7A4500", margin: 0, lineHeight: 1.6 }}>
            AI 사주풀이는 <strong>재미와 참고용</strong>이에요. 중요한 결정은 반드시 스스로 판단하세요.
          </p>
        </div>

        <AdBanner />
      </div>

      <FixedBottomCTA onClick={handleSubmit}>
        광고 보고 사주 보기
      </FixedBottomCTA>
    </div>
  );
}

function Section({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{label}</p>
        {required && (
          <span style={{ fontSize: 12, color: "#3366FF", fontWeight: 600 }}>필수</span>
        )}
        {hint && (
          <span style={{ fontSize: 12, color: "#999" }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function DateInput({
  placeholder,
  value,
  onChange,
  maxLength,
  style,
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
      onChange={(e) => {
        const v = e.target.value;
        if (v.length <= maxLength) onChange(v);
      }}
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
