import type { APIRoute } from 'astro';

/**
 * Creates a 301 permanent redirect response
 * @param targetUrl - The destination URL path
 * @returns Response with 301 status and Location header
 */
export function createRedirect(targetUrl: string): Response {
  return new Response(null, {
    status: 301,
    headers: {
      Location: targetUrl,
    },
  });
}
