const UNITS = ["B", "KB", "MB", "GB"] as const;

/** 바이트 수를 사람이 읽는 단위로 (예: 1536 → "1.5 KB") */
export function formatBytes(bytes: number): string {
  if (bytes < 1) return "0 B";
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNITS.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${UNITS[exponent]}`;
}
