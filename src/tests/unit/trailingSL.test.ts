import { calculateTrailingStopLoss } from '../../lib/trailingSL';

describe('calculateTrailingStopLoss', () => {
	const defaultSettings = {
		initialStopLossPct: 1,
		breakEvenTriggerPct: 1,
		profitLockTriggerPct: 2,
		lockedProfitPct: 1,
		trailingStepPct: 1,
		trailingGapPct: 0.5,
	};

	it('sets initial stop loss negative on open', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 0, null, 0);
		expect(result.stopLossPct).toBeLessThan(0);
		expect(result.shouldExit).toBe(false);
	});

	it('moves stop loss to zero at break-even', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 1, null, -1);
		expect(result.stopLossPct).toBe(0);
	});

	it('moves stop loss to locked profit at profit lock trigger', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 2, null, 0);
		expect(result.stopLossPct).toBe(defaultSettings.lockedProfitPct);
	});

	it('trails stop loss when MTM jumps by one step', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 3, 2, 1);
		expect(result.stopLossPct).toBeGreaterThanOrEqual(0);
		expect(result.lastTrailingLevelPct).toBe(3);
	});

	it('trails stop loss when MTM jumps by multiple steps', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 5, 2, 1);
		expect(result.lastTrailingLevelPct).toBe(5);
		expect(result.stopLossPct).toBeGreaterThanOrEqual(0);
	});

	it('never lets trailing stop loss go negative', () => {
		const settings = { ...defaultSettings, trailingGapPct: 10 };
		const result = calculateTrailingStopLoss(settings, 5, 2, 1);
		expect(result.stopLossPct).toBeGreaterThanOrEqual(0);
	});

	it('never decreases stop loss', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 2, 2, 5);
		expect(result.stopLossPct).toBe(5);
	});

	it('should exit when MTM falls below stop loss', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 0, null, 1);
		expect(result.shouldExit).toBe(true);
	});

	it('does not trail if not in profit lock zone', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 1.5, null, 0);
		expect(result.lastTrailingLevelPct).toBe(null);
	});
});
// ...existing code...
