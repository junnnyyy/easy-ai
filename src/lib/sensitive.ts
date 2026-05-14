/**
 * 클라이언트 민감정보 1차 가드 (POL-002, FR-013).
 * - 서버(`supabase/functions/_shared/sensitive.ts`)와 같은 패턴
 * - 전송 전에 가드해 네트워크 왕복 + 카운트 손해를 막는 UX 보호막
 */

const PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "주민번호", regex: /\d{6}[-–]\d{7}|\b\d{13}\b/ },
  { name: "카드번호", regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/ },
  { name: "계좌번호", regex: /\b\d{3,6}[-–]\d{2,6}[-–]\d{2,6}\b/ },
  { name: "비밀번호", regex: /(비밀번호|패스워드|pwd|password)\s*[:\s=]\s*\S+/i },
  { name: "인증서", regex: /(공인인증서|인증서\s*비밀번호|공동인증서)/ },
];

export function detectSensitive(message: string): { detected: boolean; reason?: string } {
  for (const { name, regex } of PATTERNS) {
    if (regex.test(message)) return { detected: true, reason: name };
  }
  return { detected: false };
}
