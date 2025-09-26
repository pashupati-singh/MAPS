

export function MidTimeDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const istMidnight = new Date(Date.UTC(year, month, date, -5, -30));

  return istMidnight;
}
