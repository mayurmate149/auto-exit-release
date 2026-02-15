"use client";

import React, { useState } from "react";
import OptionChainComponent from "../../../components/OptionChain";
import PayoffChartComponent from "../../../components/PayoffChart";
import OptionsPositionsWidget from "../../../components/positions";

type TabType =
  | "positions"
  | "option-chain"
  | "payoff-chart"
  | "auto-exit"
  | "analysis";

export default function FivepaistMonitorPage() {
  const [activeTab, setActiveTab] = useState<TabType>("positions");

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "positions", label: "Positions", icon: "📊" },
    { id: "option-chain", label: "Option Chain", icon: "🔗" },
    { id: "payoff-chart", label: "Payoff Chart", icon: "📈" },
    { id: "auto-exit", label: "Auto Exit", icon: "🛑" },
    { id: "analysis", label: "Analysis", icon: "🔍" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 5Paisa Options Monitor
          </h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Advanced options trading with Greeks, Payoff Analysis & Auto-Exit
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 px-4 py-3 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "positions" && (
          <div className="animate-fadeIn">
            <PositionsTab />
          </div>
        )}

        {activeTab === "option-chain" && (
          <div className="animate-fadeIn">
            <OptionChainComponent />
          </div>
        )}

        {activeTab === "payoff-chart" && (
          <div className="animate-fadeIn">
            <PayoffChartComponent />
          </div>
        )}

        {activeTab === "auto-exit" && (
          <div className="animate-fadeIn">
            <AutoExitTab />
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="animate-fadeIn">
            <AnalysisTab />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            5Paisa Options Monitor • Real-time Greeks • Payoff Analysis • Auto
            Exit with Trailing SL
          </p>
          <p className="mt-2 text-xs">
            ⚠️ Demo data used for testing. Connect real 5Paisa API in settings.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Positions Tab - Shows current open positions with real-time P&L
 */
function PositionsTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Your Open Positions</h2>
        <OptionsPositionsWidget />
      </div>
    </div>
  );
}

/**
 * Auto-Exit Tab - Shows auto-exit and trailing SL status
 */
function AutoExitTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Auto-Exit & Trailing Stop Loss</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Max Profit Trigger
            </p>
            <p className="text-2xl font-bold text-blue-600">₹50,000</p>
            <p className="text-xs text-gray-500 mt-1">When to exit with profit</p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Max Loss Trigger
            </p>
            <p className="text-2xl font-bold text-red-600">-₹25,000</p>
            <p className="text-xs text-gray-500 mt-1">When to exit with loss</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trailing SL Active
            </p>
            <p className="text-2xl font-bold text-purple-600">-₹5,000</p>
            <p className="text-xs text-gray-500 mt-1">Current trailing stop loss</p>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="font-semibold text-yellow-900 dark:text-yellow-200">
            💡 Pro Tip:
          </p>
          <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-2">
            Use auto-exit with trailing stop loss to protect profits on winning
            trades while letting them run. Configure in Dashboard &rarr; Settings
            &rarr; Risk Management.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Features</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Real-time position monitoring (backend-driven)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Automatic exit when max profit/loss reached</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Trailing stop loss (dynamic)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Scheduler support (GitHub Actions, Vercel Cron)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Activity logs & audit trail</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Analysis Tab - Greeks analysis and insights
 */
function AnalysisTab() {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Greeks Analysis & Insights</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Delta (Δ)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Rate of change of option price with respect to stock price
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
              <p className="text-xs font-mono">
                Call: +0.5 to +1.0 (positive delta) <br />
                Put: -0.5 to 0.0 (negative delta)
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use for directional trades; higher delta = more sensitive to
              underlying movement
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Gamma (Γ)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Rate of change of delta (acceleration)
            </p>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
              <p className="text-xs font-mono">
                At-the-money (ATM) = highest gamma <br />
                Out-of-the-money (OTM) = low gamma
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Higher gamma = delta changes faster; useful for timing entries
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Theta (Θ)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Time decay (per day)
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
              <p className="text-xs font-mono">
                Call/Put sellers: benefit (+theta) <br />
                Buyers: lose to time decay (-theta)
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Near expiry: theta accelerates; sell options to profit from decay
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Vega (V)</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Sensitivity to volatility changes (per 1% vol increase)
            </p>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
              <p className="text-xs font-mono">
                Both calls & puts: positive vega <br />
                ATM options: highest vega exposure
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Buy options when volatility is low; sell when high
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Quick Strategy Guides</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>Bull Call Spread:</strong> Buy ATM call, Sell OTM call
              (limited profit, limited loss)
            </li>
            <li>
              <strong>Iron Condor:</strong> Sell ATM options, Buy OTM
              puts/calls (theta decay play)
            </li>
            <li>
              <strong>Straddle:</strong> Buy ATM call + put (bet on high
              volatility)
            </li>
            <li>
              <strong>Calendar Spread:</strong> Sell near-term, buy far-term
              (theta + vega play)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
