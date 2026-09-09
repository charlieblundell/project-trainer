export function fakeCoachReply(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("30 minutes") || p.includes("short"))
    return "No problem — I'll trim today's session to the highest-priority movements and keep it to 30 minutes.";
  if (p.includes("swap") || p.includes("replace"))
    return "Sure, leg press is a solid substitute for squats — same muscles, less lower-back demand. I'll use it for today.";
  if (p.includes("why") && p.includes("bench"))
    return "You hit all three sets at 60kg comfortably last session, so I bumped your target to 62.5kg this week.";
  if (p.includes("missed"))
    return "No worries — I've folded that session's key lifts into your next workout so nothing gets skipped.";
  if (p.includes("today"))
    return "Today is Upper Body: bench press, incline DB press, lat pulldown, lateral raise, and triceps pushdown — about 52 minutes.";
  return "Got it — I'll factor that into your plan. Anything else on your mind before your next session?";
}
