/** "2026-06-12" → "06/12" — 카드·리스트의 마감일 축약 표기 */
export function formatShortDate(isoDate: string) {
  const [, month, day] = isoDate.split("-");
  return `${month}/${day}`;
}

/** Date → "YYYY-MM-DD" (로컬 기준, 타임존 오프셋 없이 date 컬럼용) */
export function formatDateColumn(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
