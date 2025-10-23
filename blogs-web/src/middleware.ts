import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Rewrite /articles/:slug -> /:slug
  if (pathname.startsWith('/articles/')) {
    const slug = pathname.replace(/^\/articles\//, '');
    const url = req.nextUrl.clone();
    url.pathname = `/${slug}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/articles/:path*'],
};