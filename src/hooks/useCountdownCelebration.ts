"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { playTimerSound } from "@/lib/sounds";
import { notifyCountdownComplete } from "@/lib/notifications";
import { isCountdownComplete } from "@/types/timer";
import type { TimerItem } from "@/types/timer";

export const CELEBRATION_MS = 4000;

type UseCountdownCelebrationOptions = {
  enabled?: boolean;
  onCelebrate?: (timer: TimerItem) => void;
};

export function useCountdownCelebration(
  timer: TimerItem,
  now: number,
  options: UseCountdownCelebrationOptions = {},
) {
  const { enabled = true, onCelebrate } = options;
  const { reducedMotion } = useTheme();
  const onCelebrateRef = useRef(onCelebrate);
  onCelebrateRef.current = onCelebrate;

  const isCountdown = timer.mode === "countdown";
  const done = isCountdown && isCountdownComplete(timer, now);
  const prevDone = useRef(done);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!enabled || !isCountdown) {
      prevDone.current = done;
      return;
    }

    if (done && !prevDone.current) {
      const tabVisible = document.visibilityState === "visible";

      notifyCountdownComplete(timer.title, timer.icon, timer.sound, {
        withSound: !tabVisible,
      });

      if (tabVisible) {
        if (!reducedMotion) {
          setCelebrating(true);
          onCelebrateRef.current?.(timer);
        }
        playTimerSound(timer.sound, reducedMotion);
        const t = window.setTimeout(
          () => setCelebrating(false),
          CELEBRATION_MS,
        );
        prevDone.current = done;
        return () => window.clearTimeout(t);
      }
    }

    prevDone.current = done;
  }, [done, enabled, isCountdown, reducedMotion, timer]);

  return {
    done,
    celebrating: celebrating && !reducedMotion,
    isCountdown,
  };
}
