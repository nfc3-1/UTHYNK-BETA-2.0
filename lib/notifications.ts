export type ReminderPreference = {
  enabled: boolean;
  preferredHour: number;
  cadence: 'daily' | 'weekdays' | 'weekends';
};

export function shouldSendReminder(
  streak = 0,
  lastSessionAt?: string | null
) {
  if (!lastSessionAt) return true;

  const last = new Date(lastSessionAt);
  const now = new Date();

  const hoursSince =
    (now.getTime() - last.getTime()) / (1000 * 60 * 60);

  if (streak >= 14) {
    return hoursSince >= 30;
  }

  return hoursSince >= 20;
}

export function generateReminderMessage(streak = 0, trait = 'Strategic Thinking') {
  if (streak >= 30) {
    return `Protect your ${streak}-day reasoning streak. Continue strengthening ${trait}.`;
  }

  if (streak >= 7) {
    return `Your cognitive momentum is building. Today's challenge sharpens ${trait}.`;
  }

  return `Complete today's reasoning challenge and continue building your cognitive profile.`;
}
