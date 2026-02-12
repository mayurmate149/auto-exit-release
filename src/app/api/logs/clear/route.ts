import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function DELETE() {
  try {
    const { db } = await connectToDatabase();
    await db.collection('logs').deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
