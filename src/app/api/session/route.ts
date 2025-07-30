import { NextRequest, NextResponse } from 'next/server';
import { SessionRequest, SessionResponse } from '@/types';
import { HTTPSEnforcer } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    // Enforce HTTPS in production
    HTTPSEnforcer.enforceHTTPS(request);

    const body: SessionRequest = await request.json();
    
    // Validate request
    if (body.type !== 'guest') {
      return NextResponse.json(
        { error: 'Invalid session type' },
        { status: 400 }
      );
    }

    // Generate session ID and expiration (24 hours from now)
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const response: SessionResponse = {
      sessionId,
      expiresAt
    };

    // Add security headers to response
    const securityHeaders = HTTPSEnforcer.getSecurityHeaders();
    const nextResponse = NextResponse.json(response);
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      nextResponse.headers.set(key, value);
    });

    return nextResponse;
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

function generateSessionId(): string {
  // Generate a cryptographically secure random session ID
  const timestamp = Date.now().toString(36);
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  const randomPart = Array.from(randomBytes, byte => byte.toString(36)).join('').substring(0, 15);
  return `guest_${timestamp}_${randomPart}`;
}