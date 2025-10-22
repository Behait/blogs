import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 返回默认的网站配置
    const siteConfig = {
      title: 'Blogs - 专业博客平台',
      description: '探索知识的无限可能，分享有价值的见解和经验',
      keywords: ['博客', '技术', '分享', '知识', '学习'],
      author: 'Blogs Team',
      logo: '/logo.svg',
      favicon: '/favicon.ico',
      social: {
        twitter: '@blogs',
        github: 'blogs',
        email: 'contact@blogs.com'
      },
      analytics: {
        googleAnalytics: '',
        baiduAnalytics: ''
      },
      seo: {
        defaultImage: '/og-image.jpg',
        twitterCard: 'summary_large_image'
      },
      features: {
        comments: true,
        search: true,
        categories: true,
        tags: true,
        rss: true,
        sitemap: true
      },
      theme: {
        primaryColor: '#6D28D9',
        secondaryColor: '#A78BFA',
        accentColor: '#EC4899'
      }
    };

    return NextResponse.json(siteConfig);
  } catch (error) {
    console.error('Error fetching site config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site config' },
      { status: 500 }
    );
  }
}