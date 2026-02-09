import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const status = await db.collection('trailing_sl_status').findOne({ _id: 'current' as any });
    return NextResponse.json({ success: true, status });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
