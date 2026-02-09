// Utility to calculate new LTP and unrealized for a position given a target total profit/loss
// Usage: const { ltp, unrealized } = calcLtpForUnrealized(avgPrice, netQty, targetUnrealized)

export function calcLtpForUnrealized(avgPrice, netQty, targetUnrealized) {
  avgPrice = Number(avgPrice);
  netQty = Number(netQty);
  targetUnrealized = Number(targetUnrealized);
  if (!netQty) {
    return { ltp: avgPrice, unrealized: 0 };
  }
  // For buy: ltp = avgPrice + targetUnrealized / |netQty|
  // For sell: ltp = avgPrice - targetUnrealized / |netQty|
  const sign = netQty > 0 ? 1 : -1;
  const ltp = avgPrice + (targetUnrealized / Math.abs(netQty)) * sign;
  return {
    ltp: Math.round(ltp * 100) / 100,
    unrealized: Math.round(targetUnrealized * 100) / 100,
  };
}
