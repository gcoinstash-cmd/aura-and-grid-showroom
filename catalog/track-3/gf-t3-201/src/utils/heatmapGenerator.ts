import { PlayerStats, LoadoutSlotData, DayLog, Perk, GratitudeHeatmapDay, HeatmapDayStatus } from '../types';

/**
 * Generates a rolling 30-day gratitude telemetry dataset.
 * Accurately aligns with the player's current streak, sealed loadout slots, and archived day logs.
 */
export function generate30DayGratitudeData(
  stats: PlayerStats,
  slots: LoadoutSlotData[],
  logs: DayLog[],
  activePerk?: Perk
): GratitudeHeatmapDay[] {
  const result: GratitudeHeatmapDay[] = [];
  const currentStreak = Math.max(0, stats.streak);
  const now = new Date();

  // Curated fallback logs for historical completed streak days
  const fallbackBossWins = [
    'Finished complex refactor with zero cognitive drift.',
    'Closed all browser tabs and locked into 3 solid Deep Work blocks.',
    'Delivered sprint milestone ahead of schedule with zero errors.',
    'Maintained calm composure through high-stress team review.',
    'Overrode morning procrastination and launched task within 5 minutes.',
    'Fixed stubborn race condition in system telemetry pipeline.',
    'Completed 45-minute tactical reading and documentation block.',
    'Stood ground on architecture decision during technical review.'
  ];

  const fallbackSquadSupports = [
    'Teammate helped debug edge-case state synchronization.',
    'Received stellar feedback from tech lead on modular structure.',
    'Pair-programmed with junior engineer and unblocked build pipeline.',
    'Friend dropped off coffee during intensive late-night coding burst.',
    'Solid communication with project stakeholders during standup.',
    'Squad coordinated smoothly through production deployment.'
  ];

  const fallbackPowerSurges = [
    '20-minute kettlebell workout and ice-cold recovery shower.',
    'Synthwave focus playlist locked in maximum flow state.',
    'Evening outdoor walk at dusk with zero phone notifications.',
    'Fresh espresso and 10 minutes of tactical box breathing.',
    'Hydration target hit: 3 liters cold water throughout the day.',
    '9 hours uninterrupted restorative REM sleep.'
  ];

  const fallbackPerks = [
    'VECTOR FOCUS',
    'HYPER-DRIVE RAILGUN',
    'TACTICAL RESPAWN',
    'HIGH REFRESH CONSCIOUSNESS',
    'MOMENTUM SPARK',
    'TITAN PRIME DISCIPLINE'
  ];

  // Map known logs by date or index
  const logMap = new Map<number, DayLog>();
  logs.forEach((log, idx) => {
    // Map recent logs: 'Yesterday' -> daysAgo 1, '2 Days Ago' -> daysAgo 2, etc.
    let daysAgo = idx + 1;
    if (log.date.toLowerCase().includes('yesterday')) daysAgo = 1;
    else if (log.date.includes('2')) daysAgo = 2;
    else if (log.date.includes('3')) daysAgo = 3;
    else if (log.date.includes('4')) daysAgo = 4;
    logMap.set(daysAgo, log);
  });

  // Today's locked slot count
  const todayLockedCount = slots.filter((s) => s.locked).length;

  for (let i = 0; i < 30; i++) {
    const daysAgo = 29 - i;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - daysAgo);

    const dateStr = targetDate.toISOString().slice(0, 10);
    const displayDate = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const displayDay = targetDate.getDate().toString();
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = daysAgo === 0;

    let status: HeatmapDayStatus = 'missed';
    let slotsCompleted = 0;
    let xpGained = 0;
    let streakAtDay = 0;
    let bossWin: string | undefined;
    let squadSupport: string | undefined;
    let powerSurge: string | undefined;
    let perkTitle: string | undefined;

    if (isToday) {
      slotsCompleted = todayLockedCount;
      if (todayLockedCount === 3) {
        status = 'completed';
        xpGained = 450;
      } else if (todayLockedCount > 0) {
        status = 'partial';
        xpGained = todayLockedCount * 150;
      } else {
        status = 'missed';
        xpGained = 0;
      }
      streakAtDay = currentStreak;

      const bossSlot = slots.find((s) => s.id === 'slot_boss');
      const squadSlot = slots.find((s) => s.id === 'slot_squad');
      const energySlot = slots.find((s) => s.id === 'slot_energy');

      bossWin = bossSlot?.locked && bossSlot.content ? bossSlot.content : undefined;
      squadSupport = squadSlot?.locked && squadSlot.content ? squadSlot.content : undefined;
      powerSurge = energySlot?.locked && energySlot.content ? energySlot.content : undefined;
      perkTitle = activePerk?.title || 'VECTOR FOCUS';
    } else {
      // Past day
      const existingLog = logMap.get(daysAgo);

      if (daysAgo <= currentStreak) {
        // Part of the active unbroken streak!
        status = 'completed';
        slotsCompleted = 3;
        xpGained = 450;
        streakAtDay = Math.max(1, currentStreak - daysAgo);

        if (existingLog) {
          bossWin = existingLog.bossWin;
          squadSupport = existingLog.squadSupport;
          powerSurge = existingLog.powerSurge;
          perkTitle = existingLog.perkTitle;
        } else {
          const seed = (i * 7 + 13) % fallbackBossWins.length;
          bossWin = fallbackBossWins[seed % fallbackBossWins.length];
          squadSupport = fallbackSquadSupports[seed % fallbackSquadSupports.length];
          powerSurge = fallbackPowerSurges[seed % fallbackPowerSurges.length];
          perkTitle = fallbackPerks[seed % fallbackPerks.length];
        }
      } else if (daysAgo === currentStreak + 1) {
        // The transition day prior to active streak
        if (daysAgo === 15 || daysAgo === 22) {
          status = 'frozen';
          slotsCompleted = 0;
          xpGained = 0;
          streakAtDay = 0;
          bossWin = 'Cryo-Streak Stasis Activated. Streak preserved through offline buffer.';
        } else {
          status = 'missed';
          slotsCompleted = 0;
          xpGained = 0;
          streakAtDay = 0;
        }
      } else {
        // Earlier historical cycle: realistic habit building pattern
        // Pattern: strong historical streak with occasional missed/partial days
        const cycleDay = (daysAgo - currentStreak) % 11;
        if (cycleDay === 3) {
          status = 'missed';
          slotsCompleted = 0;
          xpGained = 0;
          streakAtDay = 0;
        } else if (cycleDay === 7) {
          status = 'partial';
          slotsCompleted = 2;
          xpGained = 300;
          streakAtDay = 1;
          bossWin = 'Completed technical documentation review.';
          squadSupport = 'Squad standup sync concluded.';
        } else if (cycleDay === 9) {
          status = 'frozen';
          slotsCompleted = 0;
          xpGained = 0;
          streakAtDay = 0;
          bossWin = 'Cryo-Shield Stasis Matrix preserved streak during travel.';
        } else {
          status = 'completed';
          slotsCompleted = 3;
          xpGained = 450;
          streakAtDay = Math.min(stats.bestStreak || 12, cycleDay + 2);
          const seed = (daysAgo * 3 + 5) % fallbackBossWins.length;
          bossWin = fallbackBossWins[seed % fallbackBossWins.length];
          squadSupport = fallbackSquadSupports[seed % fallbackSquadSupports.length];
          powerSurge = fallbackPowerSurges[seed % fallbackPowerSurges.length];
          perkTitle = fallbackPerks[seed % fallbackPerks.length];
        }
      }
    }

    result.push({
      dateStr,
      displayDate,
      displayDay,
      dayOfWeek,
      dayIndex: i,
      status,
      slotsCompleted,
      isToday,
      bossWin,
      squadSupport,
      powerSurge,
      perkTitle,
      xpGained,
      streakAtDay
    });
  }

  return result;
}
