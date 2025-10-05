export function convertUTCToIST(dateString: any): Date {
  const utcDate = new Date(dateString);

  const istString = utcDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(istString);
}

export function nowIST(): Date {
  // Get current UTC date
  const utcDate = new Date();

  // Convert to IST (UTC + 5h30m)
  const istOffset = 5.5 * 60 * 60000; // in ms
  return new Date(utcDate.getTime() + istOffset);
}
