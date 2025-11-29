export function convertUTCToIST(dateString: any): Date {
  const utcDate = new Date(dateString);

  const istString = utcDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(istString);
}

export function nowIST(): Date {
  const utcDate = new Date();
  const istOffset = 5.5 * 60 * 60000;
  return new Date(utcDate.getTime() + istOffset);
}


export function toUtcMidnight(dateStr: string): Date {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr);
  if (m) {
    const [_, d, mo, y] = m;
    return new Date(Date.UTC(+y, +mo - 1, +d, 0, 0, 0, 0));
  }
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (isoMatch) {
    const [_, y, mo, d] = isoMatch;
    return new Date(Date.UTC(+y, +mo - 1, +d, 0, 0, 0, 0));
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) throw new Error("Invalid date format (expected dd/mm/yyyy or yyyy-mm-dd)");
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}


export function istTodayUtcRange(): { start: Date; end: Date } {
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const y = istNow.getFullYear();
  const m = istNow.getMonth();
  const d = istNow.getDate();
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));    
  const end   = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0)); 
  return { start, end };
}