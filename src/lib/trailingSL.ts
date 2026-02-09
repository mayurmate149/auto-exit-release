// src/lib/trailingSL.ts


/**
 * Calculate the updated stop loss and trailing level based on settings and MTM.
 * @param settings Object with trailing SL settings (all values in % of capital)
 * @param currentMtmPct Current MTM as % of capital (e.g. 1.5 for +1.5%)
 * @param lastTrailingLevelPct Last MTM % where SL was updated (null if never trailed)
 * @param previousStopLossPct Last applied stop loss %
 * @returns { stopLossPct, lastTrailingLevelPct, shouldExit }
 */
export function calculateTrailingStopLoss(
  settings: {
    initialStopLossPct: number,
    breakEvenTriggerPct: number,
    profitLockTriggerPct: number,
    lockedProfitPct: number,
    trailingStepPct: number,
    trailingGapPct: number,
  },
  currentMtmPct: number,
  lastTrailingLevelPct: number | null,
  previousStopLossPct: number
): {
  stopLossPct: number,
  lastTrailingLevelPct: number | null,
  shouldExit: boolean
} {
  // 1. On position open: set initial stop loss
  let stopLossPct = -Math.abs(settings.initialStopLossPct);
  let newTrailingLevelPct = lastTrailingLevelPct;

  // 2. Break-even rule
  if (currentMtmPct >= settings.breakEvenTriggerPct) {
    stopLossPct = Math.max(stopLossPct, 0);
  }

  // 3. Profit lock rule
  if (currentMtmPct >= settings.profitLockTriggerPct) {
    stopLossPct = Math.max(stopLossPct, settings.lockedProfitPct);
  }

  // 4. Continuous trailing (after profit lock trigger)
  if (currentMtmPct >= settings.profitLockTriggerPct) {
    // If lastTrailingLevelPct is null, initialize it to profitLockTriggerPct
    let lastLevel = lastTrailingLevelPct;
    if (lastLevel === null) {
      lastLevel = settings.profitLockTriggerPct;
    }
    // Trailing only if currentMtmPct has moved at least trailingStepPct above last level
    if (currentMtmPct >= lastLevel + settings.trailingStepPct) {
      // Handle fast MTM jumps: may need to advance multiple steps
      const steps = Math.floor((currentMtmPct - lastLevel) / settings.trailingStepPct);
      const newLevel = lastLevel + steps * settings.trailingStepPct;
      // New trailing stop loss
      const trailingStopLoss = currentMtmPct - settings.trailingGapPct;
      stopLossPct = Math.max(previousStopLossPct, stopLossPct, trailingStopLoss);
      newTrailingLevelPct = newLevel;
    } else {
      // No new trailing, keep previous SL
      stopLossPct = Math.max(previousStopLossPct, stopLossPct);
    }
  } else {
    // Not in trailing zone, keep previous SL if higher
    stopLossPct = Math.max(previousStopLossPct, stopLossPct);
  }

  // 5. Stop loss must never decrease
  stopLossPct = Math.max(previousStopLossPct, stopLossPct);

  // 6. Always keep hard stop loss active (already enforced by above)

  // 7. Exit if currentMtmPct <= stopLossPct
  const shouldExit = currentMtmPct <= stopLossPct;

  return {
    stopLossPct,
    lastTrailingLevelPct: newTrailingLevelPct,
    shouldExit
  };
}
