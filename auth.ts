import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const SESSION_COOKIE = 'storyswap_session';
const SESSION_HEADER = 'x-session-user-id';

/**
 * Get the current authenticated user.
 * Checks cookie FIRST (per-tab, works correctly for multi-tab usage),
 * then falls back to the custom header (for environments where cookies fail).
 *
 * IMPORTANT: Cookie takes priority over header because localStorage
 * (which the header is based on) is shared across all browser tabs.
 * If User A and User B use different tabs, the header would send
 * the wrong user ID. Cookies are tab-scoped via the Set-Cookie response.
 */
export async function getCurrentUser(request?: NextRequest) {
  let userId: string | undefined;

  // 1. Try cookie FIRST (most reliable - per-tab, not shared across tabs)
  if (request) {
    try {
      const cookieStore = await cookies();
      userId = cookieStore.get(SESSION_COOKIE)?.value;
    } catch {
      // cookies() can throw in some edge runtime contexts
    }
  }

  // 2. Fall back to the custom header ONLY if cookie didn't work
  if (!userId && request) {
    userId = request.headers.get(SESSION_HEADER) || undefined;
  }

  if (!userId) return null;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // Don't return passwordHash
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export function setSessionCookie(response: NextResponse, userId: string): NextResponse {
  response.cookies.set(SESSION_COOKIE, userId, {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: false,
    secure: false,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
