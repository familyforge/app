// Live countdown to a task's deadline.
//
// Only rendered for tasks that actually have one — a parent decides per task
// whether a deadline applies, and a task without one shows nothing rather than
// inventing urgency.
//
// Ticks once a second so a child watching the last minute sees it move. The
// colour walks calm → amber → red as the time closes, so urgency is legible at
// a glance without reading the numbers.

import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Clock, AlertCircle } from "lucide-react-native";

interface Props {
  /** ISO date the task is due on. Falls back to today when absent. */
  dueDate?: string | null;
  /** Local wall-clock "HH:mm". No deadline when null. */
  endTime?: string | null;
  compact?: boolean;
}

/**
 * Combine a due date and an HH:mm wall-clock time into a real instant.
 *
 * Wall-clock on purpose: "before 6:30pm" means 6:30pm where the family is. If
 * this were stored as a UTC timestamp, a deadline would drift when the clocks
 * change or the family travels.
 */
export function resolveDeadline(dueDate?: string | null, endTime?: string | null): Date | null {
  if (!endTime) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(endTime);
  if (!match) return null;

  const base = dueDate ? new Date(dueDate) : new Date();
  if (Number.isNaN(base.getTime())) return null;

  const deadline = new Date(base);
  deadline.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return deadline;
}

function format(msLeft: number): string {
  const total = Math.floor(msLeft / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  // Seconds only matter once the deadline is close enough to feel it.
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export function DeadlineCountdown({ dueDate, endTime, compact = false }: Props) {
  const deadline = useMemo(() => resolveDeadline(dueDate, endTime), [dueDate, endTime]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;

  const msLeft = deadline.getTime() - now;
  const overdue = msLeft <= 0;
  const minutesLeft = msLeft / 60000;

  const tone = overdue
    ? { fg: "#FF9E8F", bg: "rgba(255,122,107,0.22)", border: "rgba(255,122,107,0.5)" }
    : minutesLeft <= 15
    ? { fg: "#FFB4A8", bg: "rgba(255,122,107,0.18)", border: "rgba(255,122,107,0.42)" }
    : minutesLeft <= 60
    ? { fg: "#FFD98A", bg: "rgba(255,201,77,0.18)", border: "rgba(255,201,77,0.42)" }
    : { fg: "rgba(255,246,232,0.75)", bg: "rgba(255,246,232,0.09)", border: "rgba(255,246,232,0.18)" };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        paddingHorizontal: compact ? 8 : 10,
        paddingVertical: compact ? 3 : 5,
        borderRadius: 11,
        backgroundColor: tone.bg,
        borderWidth: 1,
        borderColor: tone.border,
        marginTop: 6,
      }}
    >
      {overdue ? <AlertCircle size={11} color={tone.fg} /> : <Clock size={11} color={tone.fg} />}
      <Text
        style={{
          fontFamily: "Baloo2_700Bold",
          fontSize: compact ? 11.5 : 12.5,
          color: tone.fg,
          // Stops the pill jittering as digits change width each second.
          fontVariant: ["tabular-nums"],
        }}
      >
        {overdue ? "Time's up!" : `${format(msLeft)} left`}
      </Text>
    </View>
  );
}

export default DeadlineCountdown;
