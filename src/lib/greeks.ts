/**
 * Greeks Calculation Library
 * Implements Black-Scholes model for calculating option Greeks: Delta, Gamma, Vega, Theta, Rho
 */

import * as math from 'mathjs'; // optional, but can use standard Math

// Standard normal CDF approximation (Abramowitz and Stegun)
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1 / (1 + p * x);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) *
      Math.exp(-x * x);

  return 0.5 * (1 + sign * y);
}

// Standard normal PDF
function normalPDF(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface GreeksResult {
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export interface OptionPrice {
  call: number;
  put: number;
}

/**
 * Calculate Black-Scholes option price
 * @param S Spot price (current stock price)
 * @param K Strike price
 * @param T Time to expiration (in years)
 * @param r Risk-free rate (annual, e.g., 0.05 for 5%)
 * @param sigma Volatility (annual, e.g., 0.2 for 20%)
 * @returns { call, put } option prices
 */
export function blackScholesPrice(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number
): OptionPrice {
  if (T <= 0 || S <= 0 || K <= 0 || sigma <= 0) {
    return { call: 0, put: 0 };
  }

  const d1 =
    (Math.log(S / K) + (r + 0.5 * Math.pow(sigma, 2)) * T) /
    (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const callPrice =
    S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2);
  const putPrice =
    K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);

  return { call: callPrice, put: putPrice };
}

/**
 * Calculate Delta
 * Delta = N(d1) for call, N(d1) - 1 for put
 */
export function calculateDelta(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isCall: boolean
): number {
  if (T <= 0 || S <= 0 || K <= 0 || sigma <= 0) return 0;

  const d1 =
    (Math.log(S / K) + (r + 0.5 * Math.pow(sigma, 2)) * T) /
    (sigma * Math.sqrt(T));
  const callDelta = normalCDF(d1);

  return isCall ? callDelta : callDelta - 1;
}

/**
 * Calculate Gamma
 * Gamma = N'(d1) / (S * sigma * sqrt(T))
 */
export function calculateGamma(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number
): number {
  if (T <= 0 || S <= 0 || K <= 0 || sigma <= 0) return 0;

  const d1 =
    (Math.log(S / K) + (r + 0.5 * Math.pow(sigma, 2)) * T) /
    (sigma * Math.sqrt(T));

  return normalPDF(d1) / (S * sigma * Math.sqrt(T));
}

/**
 * Calculate Vega (per 1% change in volatility)
 * Vega = S * N'(d1) * sqrt(T) / 100
 */
export function calculateVega(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number
): number {
  if (T <= 0 || S <= 0 || K <= 0 || sigma <= 0) return 0;

  const d1 =
    (Math.log(S / K) + (r + 0.5 * Math.pow(sigma, 2)) * T) /
    (sigma * Math.sqrt(T));

  return (S * normalPDF(d1) * Math.sqrt(T)) / 100;
}

/**
 * Calculate Theta (per day)
 * Theta = -(S * N'(d1) * sigma) / (2 * sqrt(T)) - r * K * e^(-rT) * N(d2) for call
 */
export function calculateTheta(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isCall: boolean
): number {
  if (T <= 0 || S <= 0 || K <= 0 || sigma <= 0) return 0;

  const d1 =
    (Math.log(S / K) + (r + 0.5 * Math.pow(sigma, 2)) * T) /
    (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const term1 = -(S * normalPDF(d1) * sigma) / (2 * Math.sqrt(T));
  const term2 = r * K * Math.exp(-r * T) * normalCDF(-d2);
  const term3 = r * K * Math.exp(-r * T) * normalCDF(d2);

  // Theta per year, convert to per day by dividing by 365
  const theta = isCall ? term1 - term2 : term1 + term3;
  return theta / 365;
}

/**
 * Calculate Rho (per 1% change in interest rate)
 * Rho = K * T * e^(-rT) * N(d2) for call
 */
export function calculateRho(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isCall: boolean
): number {
  if (T <= 0 || S <= 0 || K <= 0 || sigma <= 0) return 0;

  const d1 =
    (Math.log(S / K) + (r + 0.5 * Math.pow(sigma, 2)) * T) /
    (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  // Rho per 1% change in interest rate
  const rho =
    (K * T * Math.exp(-r * T) * (isCall ? normalCDF(d2) : -normalCDF(-d2))) /
    100;
  return rho;
}

/**
 * Calculate all Greeks at once
 */
export function calculateAllGreeks(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isCall: boolean
): GreeksResult {
  return {
    delta: calculateDelta(S, K, T, r, sigma, isCall),
    gamma: calculateGamma(S, K, T, r, sigma),
    vega: calculateVega(S, K, T, r, sigma),
    theta: calculateTheta(S, K, T, r, sigma, isCall),
    rho: calculateRho(S, K, T, r, sigma, isCall),
  };
}

/**
 * Implied Volatility using Newton-Raphson
 * Solves for sigma given option price, market price, and other parameters
 */
export function calculateImpliedVolatility(
  S: number,
  K: number,
  T: number,
  r: number,
  marketPrice: number,
  isCall: boolean,
  initialGuess: number = 0.25
): number {
  let sigma = initialGuess;
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    const price = isCall
      ? blackScholesPrice(S, K, T, r, sigma).call
      : blackScholesPrice(S, K, T, r, sigma).put;
    const vega = calculateVega(S, K, T, r, sigma);

    if (Math.abs(price - marketPrice) < tolerance) {
      return sigma;
    }

    if (vega < 1e-10) break;

    sigma = sigma - (price - marketPrice) / vega;
    sigma = Math.max(0.001, Math.min(sigma, 5)); // Bound sigma
  }

  return sigma;
}

/**
 * Calculate payoff for an option position
 */
export function calculatePayoff(
  spotPrice: number,
  strikePrice: number,
  quantity: number,
  premium: number,
  isCall: boolean,
  isBuy: boolean
): number {
  const intrinsicValue = isCall
    ? Math.max(spotPrice - strikePrice, 0)
    : Math.max(strikePrice - spotPrice, 0);

  const payoff = isBuy
    ? (intrinsicValue - premium) * quantity
    : (premium - (intrinsicValue - premium)) * quantity;

  return payoff;
}

/**
 * Generate payoff diagram data for charting
 */
export function generatePayoffDiagramData(
  strikePrice: number,
  premium: number,
  quantity: number,
  isCall: boolean,
  isBuy: boolean,
  spotMin?: number,
  spotMax?: number,
  step?: number
) {
  const minPrice = spotMin || strikePrice * 0.8;
  const maxPrice = spotMax || strikePrice * 1.2;
  const stepSize = step || (maxPrice - minPrice) / 100;

  const data = [];
  for (let spot = minPrice; spot <= maxPrice; spot += stepSize) {
    const payoff = calculatePayoff(spot, strikePrice, quantity, premium, isCall, isBuy);
    data.push({ spot: parseFloat(spot.toFixed(2)), payoff: parseFloat(payoff.toFixed(2)) });
  }

  return data;
}
