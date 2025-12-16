export function getMonthNameUTC(isoString: any): any {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");

  return d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
}