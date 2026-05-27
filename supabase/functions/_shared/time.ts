// KST(UTC+9) 시간 유틸.
// DB의 모든 timestamp는 KST로 저장하므로(timestamp without time zone),
// Edge Function에서 현재 시각/날짜가 필요하면 항상 이 헬퍼를 써요.
// (CLAUDE.md "시간대 (KST)" 규칙 참고)

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 현재 KST 시각의 Date 객체. 날짜 산술(setMonth/setDate 등)에 사용.
export const kstNow = (): Date => new Date(Date.now() + KST_OFFSET_MS);

// DB 저장용 KST timestamp 문자열. 'Z'(UTC 표기)를 떼어 KST 벽시계 값으로 저장.
export const nowKST = (): string => kstNow().toISOString().slice(0, -1);

// 오늘 KST 날짜 (YYYY-MM-DD).
export const todayKST = (): string => kstNow().toISOString().slice(0, 10);
