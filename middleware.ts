import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // /cascade-studioへのアクセスをルートにリダイレクト
  if (request.nextUrl.pathname === '/cascade-studio') {
    return NextResponse.redirect(new URL('/', request.url));
  }
}

// 特定のパスに対してのみミドルウェアを実行
export const config = {
  matcher: ['/cascade-studio'],
}; 