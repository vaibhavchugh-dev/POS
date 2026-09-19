export const IST = "Asia/Kolkata";

export function todayKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: IST });
}

export function isSameIstDay(iso: string, day = todayKey()) {
  return todayKey(new Date(iso)) === day;
}

export function formatIst(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
