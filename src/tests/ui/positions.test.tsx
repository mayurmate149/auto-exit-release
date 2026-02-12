import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OptionsPositionsWidget from '../../components/positions';

// Mock fetch globally
beforeAll(() => {
	global.fetch = jest.fn((url) => {
		if (url.includes('trailing-sl-status')) {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ status: { mtm: 2, trailingSL: 1 } }),
			});
		}
		if (url.includes('settings')) {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ settings: { maxProfitAmount: 100, maxLossAmount: 50, schedulerFrequency: 3000 } }),
			});
		}
		if (url.includes('positions')) {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ success: true, positions: [
					{ symbol: 'ABC', optionType: 'CE', expiry: '2026-02-10', strike: 100, netQty: 1, avgPrice: 10, ltp: 12, unrealized: 2, raw: {} }
				] }),
			});
		}
		if (url.includes('activity-log/status')) {
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ live: false, autoExitRunning: false }),
			});
		}
		return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
	}) as jest.Mock;
});

describe('OptionsPositionsWidget', () => {
	afterEach(() => {
		jest.resetAllMocks();
		// Restore default fetch mock for all tests except error state
		global.fetch = jest.fn((url) => {
			if (url.includes('trailing-sl-status')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ status: { mtm: 2, trailingSL: 1 } }),
				});
			}
			if (url.includes('settings')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ settings: { maxProfitAmount: 100, maxLossAmount: 50, schedulerFrequency: 3000 } }),
				});
			}
			if (url.includes('positions')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ success: true, positions: [
						{ symbol: 'ABC', optionType: 'CE', expiry: '2026-02-10', strike: 100, netQty: 1, avgPrice: 10, ltp: 12, unrealized: 2, raw: {} }
					] }),
				});
			}
			if (url.includes('activity-log/status')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ live: false, autoExitRunning: false }),
				});
			}
			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		}) as jest.Mock;
	});
	it('renders loading state initially', () => {
		render(<OptionsPositionsWidget />);
		expect(screen.getByText(/Loading option positions/i)).toBeInTheDocument();
	});

	it('renders positions table after loading', async () => {
		render(<OptionsPositionsWidget />);
		await waitFor(() => expect(screen.getByText('ABC')).toBeInTheDocument());
		expect(screen.getByText('CE')).toBeInTheDocument();
		expect(screen.getByText('₹10')).toBeInTheDocument();
		expect(screen.getByText('₹12')).toBeInTheDocument();
		// Use getAllByText for ₹2.00
		const elements = screen.getAllByText('₹2.00');
		expect(elements.length).toBeGreaterThan(0);
	});

	it('shows no positions message if none found', async () => {
		// Mock all fetch calls for this test
		(global.fetch as jest.Mock).mockImplementation(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ success: true, positions: [] }),
			})
		);
		render(<OptionsPositionsWidget />);
		await waitFor(() => {
			expect(screen.getByText('No option positions found for your account.')).toBeInTheDocument();
			expect(screen.getByTestId('exit-all-btn')).toBeDisabled();
		});
	});

	it('handles error state', async () => {
		(global.fetch as jest.Mock).mockRejectedValue(new Error('error'));
		render(<OptionsPositionsWidget />);
		await waitFor(() => {
			expect(screen.getByText('Error: error')).toBeInTheDocument();
			expect(screen.getByTestId('exit-all-btn')).toBeDisabled();
		});
	});

	it('renders max profit and loss cards', async () => {
		render(<OptionsPositionsWidget />);
		await waitFor(() => expect(screen.getByText('Max Profit Amount')).toBeInTheDocument());
		expect(screen.getByText('₹100')).toBeInTheDocument();
		expect(screen.getByText('Max Loss Amount')).toBeInTheDocument();
		expect(screen.getByText('₹50')).toBeInTheDocument();
	});

	it('renders trailing SL cards', async () => {
		render(<OptionsPositionsWidget />);
		await waitFor(() => expect(screen.getByText('Active Stop Loss')).toBeInTheDocument());
		expect(screen.getByText('Trailing Stop Loss')).toBeInTheDocument();
	});

	it('renders total unrealized P&L', async () => {
		render(<OptionsPositionsWidget />);
		await waitFor(() => expect(screen.getByText(/Total Unrealized P&L/i)).toBeInTheDocument());
		// There are multiple elements with '₹2.00', so use getAllByText and check at least one is present
		const elements = screen.getAllByText('₹2.00');
		expect(elements.length).toBeGreaterThan(0);
		// Optionally, check the element is inside the correct section
		const pnlSection = screen.getByText(/Total Unrealized P&L/i).parentElement;
		expect(pnlSection).toHaveTextContent('₹2.00');
	});

	it('renders Exit All button and disables when no positions', async () => {
		// Reset fetch mock for this test
		(global.fetch as jest.Mock).mockReset();
		(global.fetch as jest.Mock).mockImplementation(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ error: 'no_positions_found' }),
			})
		);
		render(<OptionsPositionsWidget />);
		await waitFor(() => {
			const elements = screen.getAllByText((content, node) =>
				content.includes('No option positions found')
			);
			expect(elements.length).toBeGreaterThan(0);
			expect(screen.getByTestId('exit-all-btn')).toBeDisabled();
		});
	});
});
// ...existing code...
