import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const logs = await db.collection('logs').find({}).sort({ timestamp: -1 }).toArray();
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch logs', details: typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error) }, { status: 500 });
  }
}
