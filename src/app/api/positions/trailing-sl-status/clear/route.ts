import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/mongodb';

export async function POST() {
  try {
    const { db } = await connectToDatabase();
    await db.collection('trailing_sl_status').deleteMany({});
    return NextResponse.json({ success: true, message: 'All trailing_sl_status entries cleared.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
