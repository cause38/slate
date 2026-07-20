/** "2026-06-12" → "06/12" — 카드·리스트의 마감일 축약 표기 */
export function formatShortDate(isoDate: string) {
  const [, month, day] = isoDate.split("-");
  return `${month}/${day}`;
}
