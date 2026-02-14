import { NextResponse } from 'next/server';
import { getAutoExitSnapshot } from '../../../../context/AutoExitStore';

export async function GET() {
  const snapshot = getAutoExitSnapshot();
  return NextResponse.json({ success: true, status: snapshot });
}
