import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Renders markdown (from the CMS) into sanitized HTML.
 * marked does not sanitize by default — DOMPurify strips any script/event
 * handlers so only Nova's own authored content ever reaches the page.
 */
export function renderMarkdown(md: string): string {
  const html = marked.parse(md || '', { async: false }) as string;
  return DOMPurify.sanitize(html);
}

/** Rough reading time based on 200 words per minute. */
export function readingTime(md: string): number {
  const words = (md || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Formats an ISO timestamp as "31 Aug 2026" (or Indonesian when lang=id). */
export function formatDate(iso: string, lang: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
