import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { fetchCategories, fetchTags } from "@/lib/cms";
import { fetchSiteConfig } from "@/lib/template";
import { TemplateProvider } from "@/components/TemplateProvider";
import DynamicLayout from "@/components/DynamicLayout";
import { headers } from "next/headers";
import Script from "next/script";
import type { Viewport } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // 优化字体加载
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // 优化字体加载
  preload: false, // 代码字体延迟加载
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "Blogs",
  description: "一个支持跨站评论的博客站群",
  keywords: "博客,文章,SEO,站群,评论",
  authors: [{ name: "Blogs Team" }],
  robots: "index, follow",
  // 使用 Next 内置格式检测配置，避免重复键
  formatDetection: { telephone: false, address: false, email: false },
  applicationName: "Blogs",
  appleWebApp: {
    title: "Blogs",
    statusBarStyle: "default",
    capable: true,
  },
};

export function generateViewport() {
  return {
    viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const templateName = headersList.get("x-template");
  const host = headersList.get("host") || "";
  const siteData = await fetchSiteConfig(host);
  const siteConfig = siteData?.siteConfig;

  let categories: any[] = [];
  let tags: any[] = [];
  try {
    categories = await fetchCategories();
  } catch (err) {
    console.warn("layout: fetchCategories failed, using empty list");
    categories = [];
  }
  try {
    tags = await fetchTags();
  } catch (err) {
    console.warn("layout: fetchTags failed, using empty list");
    tags = [];
  }

  const navbar = <NavBar categories={categories} tags={tags} />;
  const footer = (
    <div className="text-center text-sm text-gray-600">
      © {new Date().getFullYear()} Blogs · 由 Next.js + Strapi 驱动
    </div>
  );

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head />
      <body className="antialiased bg-neutral-50 text-neutral-900">
        {/* 百度自动推送脚本（无 token 不加载） */}
        {(process.env.NEXT_PUBLIC_BAIDU_TOKEN || '').trim().length > 0 ? (
          <Script id="baidu-auto-push" strategy="afterInteractive">
            {`(function(){
              var bp = document.createElement('script');
              var curProtocol = window.location.protocol.split(':')[0];
              bp.src = curProtocol === 'https' 
                ? 'https://zz.bdstatic.com/linksubmit/push.js'
                : 'http://push.zhanzhang.baidu.com/push.js';
              var s = document.getElementsByTagName('script')[0];
              s.parentNode.insertBefore(bp, s);
            })();`}
          </Script>
        ) : null}

        <TemplateProvider templateName={templateName} siteConfig={siteConfig}>
          <DynamicLayout
            navbar={navbar}
            footer={footer}
          >
            {children}
          </DynamicLayout>
        </TemplateProvider>
      </body>
    </html>
  );
}
