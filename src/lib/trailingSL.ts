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
  const safeSettings = sanitizeSettings(settings);
  const safeCurrentMtmPct = Number.isFinite(currentMtmPct) ? currentMtmPct : 0;
  const isNewPosition =
    !Number.isFinite(previousStopLossPct) ||
    (previousStopLossPct === 0 && lastTrailingLevelPct === null && safeCurrentMtmPct === 0);
  const safePreviousStopLoss = isNewPosition
    ? -Math.abs(safeSettings.initialStopLossPct)
    : Number.isFinite(previousStopLossPct)
      ? previousStopLossPct
      : -Math.abs(safeSettings.initialStopLossPct);


  // 1. On position open: set initial stop loss
  let stopLossPct = -Math.abs(safeSettings.initialStopLossPct);
  let newTrailingLevelPct = lastTrailingLevelPct;

  // 2. Break-even rule
  let breakEvenTriggered = false;
  if (safeCurrentMtmPct >= safeSettings.breakEvenTriggerPct) {
    stopLossPct = Math.max(stopLossPct, 0);
    breakEvenTriggered = true;
  }

  // 3. Profit lock rule
  let profitLockTriggered = false;
  if (safeCurrentMtmPct >= safeSettings.profitLockTriggerPct) {
    stopLossPct = Math.max(
      stopLossPct,
      safeSettings.lockedProfitPct,
      safeSettings.breakEvenTriggerPct
    );
    profitLockTriggered = true;
  }

  // 4. Continuous trailing (after profit lock trigger)
  if (safeCurrentMtmPct >= safeSettings.profitLockTriggerPct) {
    // If lastTrailingLevelPct is null, initialize it to profitLockTriggerPct
    let lastLevel = lastTrailingLevelPct;
    if (lastLevel === null) {
      lastLevel = safeSettings.profitLockTriggerPct;
    }
    // Trailing only if currentMtmPct has moved at least trailingStepPct above last level
    if (safeCurrentMtmPct >= lastLevel + safeSettings.trailingStepPct) {
      // Handle fast MTM jumps: may need to advance multiple steps
      const steps = Math.floor((safeCurrentMtmPct - lastLevel) / safeSettings.trailingStepPct);
      const newLevel = lastLevel + steps * safeSettings.trailingStepPct;
      // New trailing stop loss
      let trailingStopLoss = safeCurrentMtmPct - safeSettings.trailingGapPct;
      trailingStopLoss = clampTrailingStop(trailingStopLoss, safePreviousStopLoss);
      stopLossPct = Math.max(safePreviousStopLoss, stopLossPct, trailingStopLoss);
      newTrailingLevelPct = newLevel;
    } else {
      // No new trailing, keep previous SL
      stopLossPct = Math.max(safePreviousStopLoss, stopLossPct);
    }
  } else {
    // Not in trailing zone, keep previous SL if higher
    stopLossPct = Math.max(safePreviousStopLoss, stopLossPct);
  }

  // 5. Stop loss must never decrease
  // Clamp to zero only after break-even or profit lock triggers
  if (breakEvenTriggered || profitLockTriggered) {
    stopLossPct = Math.max(safePreviousStopLoss, stopLossPct, 0);
  } else {
    stopLossPct = Math.max(safePreviousStopLoss, stopLossPct);
  }

  // 6. Always keep hard stop loss active (already enforced by above)

  // Ensure stop loss never exceeds current MTM without breaking monotonic rule
  const clampedToMtm = Math.min(stopLossPct, safeCurrentMtmPct);
  stopLossPct = clampedToMtm < safePreviousStopLoss ? safePreviousStopLoss : clampedToMtm;
  stopLossPct = roundTwoDecimals(stopLossPct);

  // 7. Exit if currentMtmPct <= stopLossPct
  const shouldExit = safeCurrentMtmPct <= stopLossPct;

  return {
    stopLossPct,
    lastTrailingLevelPct: newTrailingLevelPct,
    shouldExit
  };
}

function sanitizeSettings(settings: {
  initialStopLossPct: number,
  breakEvenTriggerPct: number,
  profitLockTriggerPct: number,
  lockedProfitPct: number,
  trailingStepPct: number,
  trailingGapPct: number,
}) {
  const initialStopLossPct = positiveOrDefault(settings.initialStopLossPct, 1);
  const breakEvenTriggerPct = positiveOrDefault(settings.breakEvenTriggerPct, 0.5);
  const profitLockTriggerPct = Math.max(
    positiveOrDefault(settings.profitLockTriggerPct, breakEvenTriggerPct + 0.5),
    breakEvenTriggerPct
  );
  const lockedProfitPct = clampValue(settings.lockedProfitPct ?? breakEvenTriggerPct, 0, profitLockTriggerPct);
  const trailingStepPct = positiveOrDefault(settings.trailingStepPct, 0.5);
  const trailingGapPct = Math.max(positiveOrDefault(settings.trailingGapPct, 0.25), 0);

  return {
    initialStopLossPct,
    breakEvenTriggerPct,
    profitLockTriggerPct,
    lockedProfitPct,
    trailingStepPct,
    trailingGapPct,
  };
}

function positiveOrDefault(value: number, fallback: number) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num;
}

function clampValue(value: number, min: number, max: number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(Math.max(num, min), max);
}

function clampTrailingStop(candidate: number, previousStopLoss: number) {
  const safeCandidate = Number.isFinite(candidate) ? candidate : previousStopLoss;
  return Math.max(0, safeCandidate);
}

function roundTwoDecimals(value: number) {
  return Math.round(value * 100) / 100;
}
