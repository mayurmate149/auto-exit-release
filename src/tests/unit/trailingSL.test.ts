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
		expect(result.stopLossPct).toBeCloseTo(0, 5);
	});

	it('moves stop loss to locked profit at profit lock trigger', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 2, null, 0);
		expect(result.stopLossPct).toBeCloseTo(defaultSettings.lockedProfitPct, 5);
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

	it('clamps trailing stop to current mtm', () => {
		const settings = { ...defaultSettings, trailingGapPct: -5 };
		const result = calculateTrailingStopLoss(settings, 2, 2, 1);
		expect(result.stopLossPct).toBeLessThanOrEqual(2);
	});

	it('never decreases stop loss', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 2, 2, 5);
		expect(result.stopLossPct).toBe(5);
	});

	it('should exit when MTM falls below stop loss', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 0, null, 1);
		expect(result.shouldExit).toBe(true);
	});

	it('sanitizes invalid settings', () => {
		const dirtySettings: any = {
			initialStopLossPct: 0,
			breakEvenTriggerPct: -5,
			profitLockTriggerPct: NaN,
			lockedProfitPct: -3,
			trailingStepPct: 0,
			trailingGapPct: null,
		};
		const result = calculateTrailingStopLoss(dirtySettings, 1, null, NaN);
		expect(result.stopLossPct).toBeLessThanOrEqual(1);
		expect(result.shouldExit).toBe(false);
	});

	it('does not trail if not in profit lock zone', () => {
		const result = calculateTrailingStopLoss(defaultSettings, 1.5, null, 0);
		expect(result.lastTrailingLevelPct).toBe(null);
	});
});
