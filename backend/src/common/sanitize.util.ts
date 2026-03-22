/**
 * HTML sanitizer — 위험한 태그/속성/URL 제거
 * HTML 엔티티 디코딩 후 sanitize하여 인코딩 우회 방지
 */

// HTML 엔티티 디코딩 (&#xHH;, &#DDD;, &name; 우회 방지)
function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);?/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

const DANGEROUS_TAGS_WITH_CONTENT = /(<\s*(script|style)\b[^>]*>[\s\S]*?<\s*\/\s*\2\s*>)/gi;
const DANGEROUS_TAGS_SELF = /<\s*\/?\s*(iframe|object|embed|form|link|base|meta|applet|svg|math)\b[^>]*>/gi;
const ON_EVENT_ATTRS = /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi;
const JAVASCRIPT_URLS = /(href|src|action|xlink:href|formaction)\s*=\s*["']?\s*(javascript|data|vbscript)\s*:/gi;
const DATA_ATTRS = /\s+data-\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi;

export function sanitizeHtml(input: string): string {
  if (!input) return input;
  // 1. 엔티티 디코딩 (인코딩 우회 방지)
  let result = decodeEntities(input);
  // 2. script/style 태그+내용 제거
  result = result.replace(DANGEROUS_TAGS_WITH_CONTENT, '');
  // 3. 위험 태그 제거 (svg, math 포함)
  result = result.replace(DANGEROUS_TAGS_SELF, '');
  // 4. on* 이벤트 핸들러 제거
  result = result.replace(ON_EVENT_ATTRS, '');
  // 5. javascript:/data:/vbscript: URL 제거
  result = result.replace(JAVASCRIPT_URLS, '$1=""');
  // 6. 재귀적 제거 (중첩 인코딩 대응)
  const prev = result;
  result = decodeEntities(result).replace(ON_EVENT_ATTRS, '').replace(JAVASCRIPT_URLS, '$1=""');
  if (result !== prev) {
    result = result.replace(DANGEROUS_TAGS_WITH_CONTENT, '').replace(DANGEROUS_TAGS_SELF, '');
  }
  return result;
}

/** 플레인 텍스트 이스케이프 (HTML 태그 완전 제거) */
export function escapeHtml(input: string): string {
  if (!input) return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
