export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase();
    // Parse query params
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    let query: any = {};
    if (type) query.type = type;
    // Get latest 100 logs, newest first
    const logs = await db
      .collection('activity_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { db } = await connectToDatabase();
    // Only one status document, _id: 'status'
    let update: any = { updatedAt: new Date() };
    if (body.action === 'live_on') update.live = true;
    if (body.action === 'live_off') update.live = false;
    if (body.action === 'auto_exit_start') update.autoExitRunning = true;
    if (body.action === 'auto_exit_stop') update.autoExitRunning = false;
    await db.collection('activity_logs').updateOne(
      { _id: 'status' as any },
      { $set: update, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
