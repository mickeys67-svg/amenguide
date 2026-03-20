/**
 * Simple HTML sanitizer that strips dangerous tags.
 * Removes script, iframe, object, embed, form, style, link, base, meta, applet tags
 * and their content (for script/style) or just the tags (for others).
 */

const DANGEROUS_TAGS_WITH_CONTENT = /(<\s*(script|style)\b[^>]*>[\s\S]*?<\s*\/\s*\2\s*>)/gi;
const DANGEROUS_TAGS_SELF = /<\s*\/?\s*(iframe|object|embed|form|link|base|meta|applet)\b[^>]*>/gi;
const ON_EVENT_ATTRS = /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi;
const JAVASCRIPT_URLS = /(href|src|action)\s*=\s*["']?\s*javascript\s*:/gi;

export function sanitizeHtml(input: string): string {
  if (!input) return input;
  let result = input;
  // Remove script/style tags and their content
  result = result.replace(DANGEROUS_TAGS_WITH_CONTENT, '');
  // Remove dangerous self-closing/opening tags
  result = result.replace(DANGEROUS_TAGS_SELF, '');
  // Remove on* event handler attributes
  result = result.replace(ON_EVENT_ATTRS, '');
  // Remove javascript: URLs
  result = result.replace(JAVASCRIPT_URLS, '$1=""');
  return result;
}
