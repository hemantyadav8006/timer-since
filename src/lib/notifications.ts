/**
 * Notification engine supporting browser notifications, sound, and badge updates.
 */

let swRegistration: ServiceWorkerRegistration | null = null;

/** Register the service worker without prompting for permission. */
export async function registerNotificationServiceWorker(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("serviceWorker" in navigator)) return false;

  try {
    swRegistration = await navigator.serviceWorker.register("/sw.js");
    return true;
  } catch {
    return false;
  }
}

/** Request notification permission — call only from explicit user action. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") {
    await registerNotificationServiceWorker();
    return true;
  }
  if (Notification.permission === "denied") return false;

  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;
  return registerNotificationServiceWorker();
}

export function canSendNotifications(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  );
}

export type NotifyOptions = {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  sound?: boolean;
};

export function sendNotification(opts: NotifyOptions): void {
  if (typeof window === "undefined" || !canSendNotifications()) return;

  if (swRegistration) {
    swRegistration.showNotification(opts.title, {
      body: opts.body,
      icon: opts.icon ?? "/icon.svg",
      tag: opts.tag,
      requireInteraction: opts.requireInteraction ?? false,
    });
  } else {
    new Notification(opts.title, {
      body: opts.body,
      icon: opts.icon ?? "/icon.svg",
      tag: opts.tag,
    });
  }

  if (opts.sound) {
    try {
      const audio = new Audio("/heartbeat.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch {
      /* audio not available */
    }
  }

  updateBadge();
}

export function notifyMilestoneAchieved(
  timerTitle: string,
  milestoneLabel: string,
  milestoneIcon: string,
): void {
  sendNotification({
    title: `${milestoneIcon} Milestone Reached!`,
    body: `"${timerTitle}" has reached ${milestoneLabel}`,
    tag: `milestone-${timerTitle}-${milestoneLabel}`,
    sound: true,
  });
}

export function notifyCountdownComplete(timerTitle: string, timerIcon: string): void {
  sendNotification({
    title: `${timerIcon} Countdown Complete!`,
    body: `"${timerTitle}" has finished!`,
    tag: `countdown-complete-${timerTitle}`,
    requireInteraction: true,
    sound: true,
  });
}

function updateBadge(): void {
  if ("setAppBadge" in navigator) {
    (navigator as unknown as { setAppBadge: (n: number) => Promise<void> })
      .setAppBadge(1)
      .catch(() => {});
  }
}

export function clearBadge(): void {
  if ("clearAppBadge" in navigator) {
    (navigator as unknown as { clearAppBadge: () => Promise<void> })
      .clearAppBadge()
      .catch(() => {});
  }
}
