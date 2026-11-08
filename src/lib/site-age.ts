// Beijing calendar days, inclusive of launch day. This is not an uptime monitor.
export const launchDate = '2026-10-27';
const dayMs = 86_400_000;
const beijingOffset = 8 * 60 * 60 * 1000;
const launchTime = Date.parse(`${launchDate}T00:00:00+08:00`);

export function siteAge(now = Date.now()) {
  const days = Math.max(0, Math.floor((now - launchTime) / dayMs) + 1);
  const year = new Date(now + beijingOffset).getUTCFullYear();
  const firstYear = Number(launchDate.slice(0, 4));
  return {
    days,
    years: year > firstYear ? `${firstYear}–${year}` : String(firstYear),
    nextUpdate: dayMs - ((now + beijingOffset) % dayMs),
  };
}
