// Middleware for session refresh
import { NextResponse } from 'next/server';
import { getSession } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const session = await getSession(req);

  // Check if the session exists
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Add the session to the response headers
  const response = NextResponse.next();
  response.headers.set('X-Session-Token', session.access_token);

  return response;
}