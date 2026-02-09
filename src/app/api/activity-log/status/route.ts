import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const status = await db.collection('activity_logs').findOne({ _id: 'status' as any });
    return NextResponse.json({
      live: status?.live ?? false,
      autoExitRunning: status?.autoExitRunning ?? false,
      updatedAt: status?.updatedAt ?? null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
