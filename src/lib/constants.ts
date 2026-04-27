export const SITE_URL = 'https://www.formx.ai';

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}
export const SITE_NAME = 'FormX.ai';
export const SITE_DEFAULT_OG_IMAGE =
  '/images/ui/og_image.webp';
export const GOOGLE_VERIFICATION = 'zDO8f7LILx_udzPGcBN2_mqeLPUMMmPcuJgwjppm_jg';
export const SIGNUP_URL = 'https://formextractorai.com/signup';
export const DEMO_CALENDLY_URL = 'https://calendly.com/d/cssd-shv-wys/formx-ai-demo';
