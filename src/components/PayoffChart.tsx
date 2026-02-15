"use client";

import React, { useState, useMemo } from "react";
import { generatePayoffDiagramData, calculatePayoff } from "../../../../lib/greeks";

interface PayoffPosition {
  id: string;
  symbol: string;
  strike: number;
  optionType: "CE" | "PE";
  quantity: number;
  premium: number;
  isBuy: boolean;
}

export default function PayoffChartComponent() {
  const [positions, setPositions] = useState<PayoffPosition[]>([
    {
      id: "1",
      symbol: "NIFTY",
      strike: 24650,
      optionType: "CE",
      quantity: 1,
      premium: 150,
      isBuy: true,
    },
    {
      id: "2",
      symbol: "NIFTY",
      strike: 24750,
      optionType: "CE",
      quantity: 1,
      premium: 95,
      isBuy: false,
    },
  ]);

  const [newPosition, setNewPosition] = useState<PayoffPosition>({
    id: Date.now().toString(),
    symbol: "NIFTY",
    strike: 24650,
    optionType: "CE",
    quantity: 1,
    premium: 150,
    isBuy: true,
  });

  const spotMin = 24000;
  const spotMax = 25300;

  // Calculate combined payoff for all positions
  const payoffData = useMemo(() => {
    const combined: Record<number, number> = {};

    for (let spot = spotMin; spot <= spotMax; spot += 10) {
      let totalPayoff = 0;
      positions.forEach((pos) => {
        const payoff = calculatePayoff(
          spot,
          pos.strike,
          pos.quantity,
          pos.premium,
          pos.optionType === "CE",
          pos.isBuy
        );
        totalPayoff += payoff;
      });
      combined[spot] = totalPayoff;
    }

    return Object.entries(combined).map(([spot, payoff]) => ({
      spot: parseInt(spot),
      payoff,
    }));
  }, [positions]);

  // Find max profit/loss and breakeven points
  const stats = useMemo(() => {
    const payoffs = payoffData.map((d) => d.payoff);
    const maxProfit = Math.max(...payoffs);
    const maxLoss = Math.min(...payoffs);
    const breakevens = payoffData.filter(
      (d, i) =>
        (payoffData[i - 1]?.payoff || 0) * d.payoff < 0 ||
        (d.payoff === 0 && payoffs.length > 1)
    );

    return { maxProfit, maxLoss, breakevens };
  }, [payoffData]);

  const handleAddPosition = () => {
    setPositions([...positions, { ...newPosition, id: Date.now().toString() }]);
    setNewPosition({
      id: Date.now().toString(),
      symbol: "NIFTY",
      strike: 24650,
      optionType: "CE",
      quantity: 1,
      premium: 150,
      isBuy: true,
    });
  };

  const handleRemovePosition = (id: string) => {
    setPositions(positions.filter((p) => p.id !== id));
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Payoff Chart Builder</h2>

      {/* Current Positions */}
      <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Positions</h3>
        {positions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No positions added</p>
        ) : (
          <div className="space-y-2">
            {positions.map((pos) => (
              <div key={pos.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded">
                <span className="text-sm">
                  {pos.isBuy ? "✓ BUY" : "✗ SELL"} {pos.quantity}x {pos.symbol}{" "}
                  {pos.strike} {pos.optionType} @ ₹{pos.premium}
                </span>
                <button
                  onClick={() => handleRemovePosition(pos.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Position Form */}
      <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add Position</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Symbol"
            value={newPosition.symbol}
            onChange={(e) =>
              setNewPosition({ ...newPosition, symbol: e.target.value.toUpperCase() })
            }
            className="px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
          <input
            type="number"
            placeholder="Strike"
            value={newPosition.strike}
            onChange={(e) =>
              setNewPosition({ ...newPosition, strike: parseFloat(e.target.value) })
            }
            className="px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
          <select
            value={newPosition.optionType}
            onChange={(e) =>
              setNewPosition({
                ...newPosition,
                optionType: e.target.value as "CE" | "PE",
              })
            }
            className="px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
          >
            <option value="CE">CE</option>
            <option value="PE">PE</option>
          </select>
          <input
            type="number"
            placeholder="Qty"
            value={newPosition.quantity}
            onChange={(e) =>
              setNewPosition({ ...newPosition, quantity: parseFloat(e.target.value) })
            }
            className="px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
          <input
            type="number"
            placeholder="Premium"
            value={newPosition.premium}
            onChange={(e) =>
              setNewPosition({ ...newPosition, premium: parseFloat(e.target.value) })
            }
            className="px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
          <select
            value={newPosition.isBuy ? "buy" : "sell"}
            onChange={(e) =>
              setNewPosition({ ...newPosition, isBuy: e.target.value === "buy" })
            }
            className="px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
          >
            <option value="buy">BUY</option>
            <option value="sell">SELL</option>
          </select>
          <button
            onClick={handleAddPosition}
            className="col-span-2 md:col-span-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold text-sm"
          >
            Add
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Max Profit</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{stats.maxProfit.toFixed(0)}
          </p>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Max Loss</p>
          <p className="text-2xl font-bold text-red-600">
            ₹{stats.maxLoss.toFixed(0)}
          </p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <p className="text-gray-600 dark:text-gray-400 text-sm">Breakeven Points</p>
          <p className="text-xl font-bold">
            {stats.breakevens.length} point{stats.breakevens.length !== 1 ? "s" : ""}
          </p>
          {stats.breakevens.length > 0 && (
            <p className="text-xs mt-1">
              {stats.breakevens.map((b) => b.spot).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Payoff Diagram</h3>
        <SimpleLineChart data={payoffData} />
      </div>
    </div>
  );
}

/**
 * Simple ASCII/SVG-based line chart for payoff diagram
 */
function SimpleLineChart({
  data,
}: {
  data: { spot: number; payoff: number }[];
}) {
  const width = 800;
  const height = 300;
  const padding = 40;

  const minSpot = Math.min(...data.map((d) => d.spot));
  const maxSpot = Math.max(...data.map((d) => d.spot));
  const minPayoff = Math.min(...data.map((d) => d.payoff));
  const maxPayoff = Math.max(...data.map((d) => d.payoff));

  const spotRange = maxSpot - minSpot || 1;
  const payoffRange = maxPayoff - minPayoff || 1;

  const scaleX = (spot: number) =>
    padding + ((spot - minSpot) / spotRange) * (width - 2 * padding);
  const scaleY = (payoff: number) =>
    height - padding - ((payoff - minPayoff) / payoffRange) * (height - 2 * padding);

  // Generate SVG path
  const pathData = data
    .map((d, i) => {
      const x = scaleX(d.spot);
      const y = scaleY(d.payoff);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="border rounded bg-white dark:bg-gray-900">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={`h-${frac}`}
          x1={padding}
          y1={height - padding - frac * (height - 2 * padding)}
          x2={width - padding}
          y2={height - padding - frac * (height - 2 * padding)}
          stroke="#e0e0e0"
          strokeDasharray="4"
          strokeWidth="1"
        />
      ))}

      {/* Zero line */}
      <line
        x1={padding}
        y1={scaleY(0)}
        x2={width - padding}
        y2={scaleY(0)}
        stroke="#999"
        strokeWidth="2"
      />

      {/* Payoff curve */}
      <path
        d={pathData}
        stroke="#2563eb"
        strokeWidth="2"
        fill="none"
      />

      {/* Axes */}
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="#000"
        strokeWidth="2"
      />
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#000"
        strokeWidth="2"
      />

      {/* Labels */}
      <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="12">
        Spot Price
      </text>
      <text x={15} y={height / 2} textAnchor="middle" fontSize="12">
        Payoff
      </text>

      {/* Axis values */}
      <text x={padding - 5} y={scaleY(0) + 5} textAnchor="end" fontSize="10">
        0
      </text>
      <text x={width - padding + 5} y={height - padding + 15} fontSize="10">
        {maxSpot.toFixed(0)}
      </text>
    </svg>
  );
}
