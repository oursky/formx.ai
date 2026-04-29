import type { APIRoute } from 'astro';
import { createRedirect } from '../../lib/redirects';

export const GET: APIRoute = () => {
  return createRedirect('/blog/p2p-data-flow-mapping-enterprise-automation');
};
