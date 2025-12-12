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


export function toUtcMidnight(planDate: string): Date {
  const s = planDate.trim();

  // dd/mm/yyyy  OR  mm/dd/yyyy (we'll read as dd/mm by default)
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (slash) {
    let dd = Number(slash[1]);
    let mm = Number(slash[2]);
    const yyyy = Number(slash[3]);

    // if clearly mm/dd (second part > 12), swap
    if (mm > 12) {
      const tmp = dd;
      dd = mm;
      mm = tmp;
    }

    const d = new Date();
    d.setUTCFullYear(yyyy, mm - 1, dd);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  // yyyy-mm-dd
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) {
    const yyyy = Number(iso[1]);
    const mm = Number(iso[2]);
    const dd = Number(iso[3]);

    const d = new Date();
    d.setUTCFullYear(yyyy, mm - 1, dd);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  // fallback: parse whatever JS understands
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new Error("Invalid date format");
  d.setUTCHours(0, 0, 0, 0);
  return d;
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