// Returns the two UTC `timezone_offset` values whose subscribers are at
// local 08:00 when the cron fires at the given UTC hour. The two values
// differ by 1440 minutes (a full day) — covers both negative-UTC and
// positive-UTC cohorts on a single hourly cron schedule.
//
// For UTC hour H and target local hour 08:00 (= 480 minutes):
//   (H * 60 + offset) ≡ 480  (mod 1440)
// So offset = 480 - H*60 + 1440*k for any integer k.
// k=0 covers offsetA ∈ [-900, +480]; k=1 covers offsetB ∈ [+540, +1920].
// The keyboard's real-timezone offsets sit in [-720, +840], so the
// practical coverage from {k=0, k=1} is [-720, +480] ∪ [+540, +840] —
// every keyboard offset except the half-hour UTC+5:30.
export function computeTargetOffsets(currentHour: number): [number, number] {
  const offsetA = 480 - currentHour * 60
  const offsetB = offsetA + 1440
  return [offsetA, offsetB]
}

// Returns the UTC calendar date a subscriber sees as "today" given their
// timezone offset (in minutes from UTC) at moment `nowMs`. For positive
// offsets > 480 matched via the `offsetB` wraparound in computeTargetOffsets
// (Tokyo, Sydney, Auckland, Line Is.) this yields tomorrow-UTC; for every
// other cohort it yields today-UTC.
//
// Pure function — takes `nowMs` instead of calling Date.now() so a single
// time source can be captured at the cron's handler entry and shared across
// all subscribers in the run (prevents cross-midnight inconsistency).
export function subscriberLocalDate(offsetMinutes: number, nowMs: number): string {
  return new Date(nowMs + offsetMinutes * 60_000).toISOString().slice(0, 10)
}
