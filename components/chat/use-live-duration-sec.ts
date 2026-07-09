import { useEffect, useState } from "react";

function computeDurationSec(timestamp: number, now: number): number {
  return Math.max(1, Math.ceil((now - timestamp) / 1000));
}

/** Elapsed whole seconds since `timestamp`, ticked every second while `active`. */
export function useLiveDurationSec(
  timestamp: number | undefined,
  active: boolean
): number | undefined {
  const [durationSec, setDurationSec] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!active || timestamp === undefined) {
      setDurationSec(undefined);
      return;
    }

    const update = () => setDurationSec(computeDurationSec(timestamp, Date.now()));

    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [active, timestamp]);

  return durationSec;
}
