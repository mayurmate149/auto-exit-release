import { NextResponse } from 'next/server';
import { resetAutoExitSnapshot } from '../../../../../context/AutoExitStore';

export async function POST() {
  resetAutoExitSnapshot();
  return NextResponse.json({ success: true, message: 'Trailing SL snapshot cleared.' });
}
