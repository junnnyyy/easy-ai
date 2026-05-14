/**
 * 민감정보 패턴 검사 (POL-002, FR-013)
 * - 의심되면 blocked_inputs에 input_preview(앞 20자)만 기록하고 전문은 저장하지 않음
 */

type Pattern = { name: string; regex: RegExp };

const PATTERNS: Pattern[] = [
  // 주민등록번호: 6자리-7자리 또는 13자리 연속
  { name: "주민번호", regex: /\d{6}[-–]\d{7}|\b\d{13}\b/ },
  // 카드번호: 16자리 연속 또는 4자리-4자리-4자리-4자리
  { name: "카드번호", regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/ },
  // 계좌번호: 10~14자리 연속 (하이픈 구분 포함)
  { name: "계좌번호", regex: /\b\d{3,6}[-–]\d{2,6}[-–]\d{2,6}\b/ },
  // 비밀번호 키워드 + 숫자 조합
  { name: "비밀번호", regex: /(비밀번호|패스워드|pwd|password)\s*[:\s=]\s*\S+/i },
  // 공인인증서 비밀번호 관련
  { name: "인증서", regex: /(공인인증서|인증서\s*비밀번호|공동인증서)/ },
];

export type SensitiveResult =
  | { detected: false }
  | { detected: true; reason: string; preview: string };

export function detectSensitive(message: string): SensitiveResult {
  for (const { name, regex } of PATTERNS) {
    if (regex.test(message)) {
      return {
        detected: true,
        reason: name,
        preview: message.slice(0, 20),
      };
    }
  }
  return { detected: false };
}
