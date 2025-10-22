/**
 * HTML 解析器工具
 * 为 HTML 内容中的列表元素添加 key 属性，解决 React 警告
 */

/**
 * 为 HTML 内容中的列表元素添加 key 属性
 * @param html 原始 HTML 内容
 * @returns 处理后的 HTML 内容
 */
export function addKeysToListElements(html: string): string {
  if (!html || typeof html !== 'string') {
    return html;
  }

  let processedHtml = html;
  let keyCounter = 0;

  // 为 <li> 元素添加 key 属性
  processedHtml = processedHtml.replace(/<li(\s[^>]*)?>/gi, (match, attributes) => {
    // 检查是否已经有 key 属性
    if (attributes && /\bkey\s*=/i.test(attributes)) {
      return match; // 已有 key 属性，不处理
    }
    
    keyCounter++;
    const existingAttrs = attributes || '';
    return `<li${existingAttrs} key="list-item-${keyCounter}">`;
  });

  // 为 <ul> 元素添加 key 属性
  processedHtml = processedHtml.replace(/<ul(\s[^>]*)?>/gi, (match, attributes) => {
    // 检查是否已经有 key 属性
    if (attributes && /\bkey\s*=/i.test(attributes)) {
      return match; // 已有 key 属性，不处理
    }
    
    keyCounter++;
    const existingAttrs = attributes || '';
    return `<ul${existingAttrs} key="list-${keyCounter}">`;
  });

  // 为 <ol> 元素添加 key 属性
  processedHtml = processedHtml.replace(/<ol(\s[^>]*)?>/gi, (match, attributes) => {
    // 检查是否已经有 key 属性
    if (attributes && /\bkey\s*=/i.test(attributes)) {
      return match; // 已有 key 属性，不处理
    }
    
    keyCounter++;
    const existingAttrs = attributes || '';
    return `<ol${existingAttrs} key="ordered-list-${keyCounter}">`;
  });

  return processedHtml;
}

/**
 * 为 HTML 内容中的所有可能需要 key 的元素添加 key 属性
 * @param html 原始 HTML 内容
 * @returns 处理后的 HTML 内容
 */
export function addKeysToAllElements(html: string): string {
  if (!html || typeof html !== 'string') {
    return html;
  }

  let processedHtml = addKeysToListElements(html);
  let keyCounter = 1000; // 使用更大的起始值避免冲突

  // 为其他可能重复的元素添加 key 属性
  const elementsToProcess = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  
  elementsToProcess.forEach(tagName => {
    const regex = new RegExp(`<${tagName}(\\s[^>]*)?(?<!key\\s*=\\s*[^\\s>]+)>`, 'gi');
    processedHtml = processedHtml.replace(regex, (match, attributes) => {
      // 检查是否已经有 key 属性
      if (attributes && /\bkey\s*=/i.test(attributes)) {
        return match; // 已有 key 属性，不处理
      }
      
      keyCounter++;
      const existingAttrs = attributes || '';
      return `<${tagName}${existingAttrs} key="${tagName}-${keyCounter}">`;
    });
  });

  return processedHtml;
}

/**
 * 清理 HTML 内容中的无效 key 属性
 * @param html HTML 内容
 * @returns 清理后的 HTML 内容
 */
export function cleanInvalidKeys(html: string): string {
  if (!html || typeof html !== 'string') {
    return html;
  }

  // 移除重复的 key 属性
  return html.replace(/\s+key\s*=\s*["'][^"']*["']\s+key\s*=\s*["'][^"']*["']/gi, (match) => {
    const firstKey = match.match(/key\s*=\s*["'][^"']*["']/i)?.[0];
    return firstKey ? ` ${firstKey}` : '';
  });
}