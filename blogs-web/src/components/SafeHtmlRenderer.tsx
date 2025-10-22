'use client';

import React, { useEffect, useState } from 'react';

interface SafeHtmlRendererProps {
  html: string;
  className?: string;
  uniqueId?: string | number; // 添加唯一标识符
}

/**
 * 安全的 HTML 渲染器组件
 * 将 HTML 字符串解析为 React 元素，为列表项添加 key 属性
 */
export default function SafeHtmlRenderer({ html, className, uniqueId }: SafeHtmlRendererProps) {
  const [reactElements, setReactElements] = useState<React.ReactNode>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !html || typeof html !== 'string') {
      return;
    }

    // 解析 HTML 并转换为 React 元素
    const parseHtmlToReact = (htmlString: string): React.ReactNode => {
      // 创建临时 DOM 元素来解析 HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;

      // 递归转换 DOM 节点为 React 元素
      const convertNodeToReact = (node: Node, index: number, parentTag?: string, depth: number = 0): React.ReactNode => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          const tagName = element.tagName.toLowerCase();
          
          // 为列表项生成更具体的 key，包含深度信息
          let keyPrefix = tagName;
          if (tagName === 'li' && parentTag === 'ul') {
            keyPrefix = `ul-li-d${depth}`;
          } else if (tagName === 'li' && parentTag === 'ol') {
            keyPrefix = `ol-li-d${depth}`;
          } else if (tagName === 'ul') {
            keyPrefix = `ul-d${depth}`;
          } else if (tagName === 'ol') {
            keyPrefix = `ol-d${depth}`;
          }
          
          const props: any = { key: `${keyPrefix}-${index}${uniqueId ? `-${uniqueId}` : ''}` };

          // 复制属性
          Array.from(element.attributes).forEach(attr => {
            if (attr.name === 'class') {
              props.className = attr.value;
            } else if (attr.name === 'style') {
              props.style = parseStyleString(attr.value);
            } else {
              props[attr.name] = attr.value;
            }
          });

          // 递归处理子节点，传递当前标签名作为父标签，增加深度
          const children = Array.from(element.childNodes).map((child, childIndex) =>
            convertNodeToReact(child, childIndex, tagName, depth + 1)
          );

          return React.createElement(tagName, props, ...children);
        }

        return null;
      };

      // 转换所有子节点，为顶级节点添加 key
      const topLevelNodes = Array.from(tempDiv.childNodes).map((node, index) =>
        convertNodeToReact(node, index)
      );
      
      // 如果只有一个顶级节点，直接返回
      if (topLevelNodes.length === 1) {
        return topLevelNodes[0];
      }
      
      // 多个顶级节点时，为每个节点添加 key
      return topLevelNodes.map((node, index) => {
        // 如果是 React 元素，克隆并添加 key（如果还没有 key）
        if (React.isValidElement(node)) {
          const existingKey = node.key;
          const newKey = existingKey ? existingKey : `top-level-${index}`;
          return React.cloneElement(node, { key: newKey });
        }
        // 如果是文本节点或其他类型，包装在 span 中
        return <span key={`text-${index}${uniqueId ? `-${uniqueId}` : ''}`}>{node}</span>;
      });
    };

    // 解析 style 字符串为对象
    const parseStyleString = (styleStr: string): React.CSSProperties => {
      const styles: React.CSSProperties = {};
      if (!styleStr) return styles;

      styleStr.split(';').forEach(rule => {
        const [property, value] = rule.split(':').map(s => s.trim());
        if (property && value) {
          // 转换 CSS 属性名为 camelCase
          const camelCaseProperty = property.replace(/-([a-z])/g, (_, letter) =>
            letter.toUpperCase()
          );
          (styles as any)[camelCaseProperty] = value;
        }
      });

      return styles;
    };

    try {
      const elements = parseHtmlToReact(html);
      setReactElements(elements);
    } catch (error) {
      console.error('Error parsing HTML:', error);
      // 降级到 dangerouslySetInnerHTML
      setReactElements(null);
    }
  }, [html, isClient]);

  // 服务端渲染或解析失败时使用 dangerouslySetInnerHTML
  if (!isClient || reactElements === null) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return <div className={className}>{reactElements}</div>;
}