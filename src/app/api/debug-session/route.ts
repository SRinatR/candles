import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      session: session,
      hasSession: !!session,
      userRole: (session?.user as any)?.role,
      userType: (session?.user as any)?.userType,
      isPredefined: (session?.user as any)?.isPredefined
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get session',
      details: error.message
    }, { status: 500 });
  }
}