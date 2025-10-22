'use client';

import { useEffect, useState } from 'react';
import { addInternalLinks } from '@/lib/internal-links';
import { addKeysToListElements } from '@/lib/html-parser';
import LoadingSpinner from './LoadingSpinner';

interface ArticleContentProps {
  content: string;
  currentSlug: string;
  className?: string;
}

export default function ArticleContent({ content, currentSlug, className = '' }: ArticleContentProps) {
  const [processedContent, setProcessedContent] = useState(content);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const processContent = async () => {
      try {
        const enhanced = await addInternalLinks(content, {
          excludeCurrentSlug: currentSlug,
          maxLinks: 5,
          minKeywordLength: 2,
        });
        if (isMounted) {
          // 先添加内部链接，再为列表元素添加 key 属性
          const contentWithKeys = addKeysToListElements(enhanced);
          setProcessedContent(contentWithKeys);
        }
      } catch (error) {
        console.error('处理内链时出错:', error);
        if (isMounted) {
          setProcessedContent(content); // 降级到原始内容
        }
      } finally {
        if (isMounted) {
          setIsProcessing(false);
        }
      }
    };

    processContent();
    
    return () => {
      isMounted = false;
    };
  }, [content, currentSlug]);

  if (isProcessing) {
    return (
      <div className={`${className} content-section`}>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${className} content-section prose prose-lg max-w-none`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}