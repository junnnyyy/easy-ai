import { Button } from "@toss/tds-mobile";

type Props = {
  title: string;
  onBack: () => void;
};

export function NavBar({ title, onBack }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "12px 8px 12px 4px",
        gap: 4,
      }}
    >
      <Button variant="weak" size="small" onClick={onBack}>
        ← 뒤로
      </Button>
      <span style={{ fontSize: 17, fontWeight: 600, flex: 1, textAlign: "center" }}>
        {title}
      </span>
      <div style={{ width: 60 }} />
    </div>
  );
}
