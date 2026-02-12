"use client";
import React, { useEffect, useState } from "react";
import { showToast } from "@/components/common/Toaster";

export default function AutoExitLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchLogs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/logs", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch logs");
      showToast(err.message || "Failed to fetch logs", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  async function handleClearLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/clear", { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      showToast("Logs cleared successfully", { type: "success" });
      await fetchLogs();
    } catch (err: any) {
      showToast(err.message || "Failed to clear logs", { type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 mx-auto">
      <div className="mb-4 flex gap-2">
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={handleClearLogs}
          disabled={loading}
        >
          Clear Logs
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={fetchLogs}
          disabled={loading}
        >
          Refresh Logs
        </button>
      </div>
      {loading && <div>Loading logs...</div>}
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {!loading && logs.length === 0 && <div>No logs found.</div>}
      {!loading && logs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full border border-accent/30 rounded-lg">
              <thead className="bg-accent/10 text-left">
                <tr>
                  <th className="px-4 py-2">Timestamp</th>
                  <th className="px-4 py-2">Level</th>
                  <th className="px-4 py-2">Message</th>
                  <th className="px-4 py-2">Meta</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}</td>
                    <td className="px-4 py-2 font-semibold">{log.level || "-"}</td>
                    <td className="px-4 py-2 break-all">{log.message || "-"}</td>
                    <td className="px-4 py-2 break-all">{log.meta ? JSON.stringify(log.meta) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
