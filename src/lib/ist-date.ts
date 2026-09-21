const IST_OFFSET_MINUTES = 5 * 60 + 30; // UTC+5:30

// Server clocks (Vercel) run UTC regardless of where the user is — every
// "current date/time" calculation in Flow must be anchored to IST
// explicitly, never the server's local time.
export function nowIST(): Date {
  const utcNow = Date.now();
  return new Date(utcNow + IST_OFFSET_MINUTES * 60 * 1000);
}

export function todayISTDateString(): string {
  return nowIST().toISOString().slice(0, 10);
}

export function currentISTMonthKey(): string {
  const d = nowIST();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
