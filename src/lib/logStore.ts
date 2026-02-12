import { connectToDatabase } from './mongodb';

// In-memory log store for fast access
const logs: Array<{ timestamp: string; level: string; message: string; meta?: any }> = [];

export async function addLog(level: string, message: string, meta?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };
  logs.push(logEntry);
  // Save to MongoDB for persistence
  try {
    const { db } = await connectToDatabase();
    await db.collection('logs').insertOne(logEntry);
  } catch (err) {
    // Optionally handle DB error (e.g., log to console)
    // console.error('Failed to save log to DB:', err);
  }
}

export function getLogs() {
  return logs;
}
