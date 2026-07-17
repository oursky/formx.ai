export interface Partner {
  name: string;
  slug: string | null;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  country: string | null;
  types: string[];
}

export const PARTNER_DIRECTORY_URL =
  'https://partners.skymakers.digital/api/directory/formx.json';

export const PARTNER_REGISTER_URL = 'https://partners.skymakers.digital/register';

export const PARTNER_CONTACT_EMAIL = 'hello@formx.ai';

const PARTNER_TYPE_LABELS: Record<string, string> = {
  referral: 'Referral Partner',
  channel: 'Channel Partner',
  technology: 'Technology Partner',
};

export function partnerTypeLabel(type: string): string {
  return (
    PARTNER_TYPE_LABELS[type] ??
    `${type.charAt(0).toUpperCase()}${type.slice(1)} Partner`
  );
}

// The directory endpoint occasionally returns transient 5xx errors, so retry
// a few times before failing the build.
export async function getPartners(): Promise<Partner[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(PARTNER_DIRECTORY_URL);
      if (!res.ok) throw new Error(`Partner directory returned ${res.status}`);
      const data = (await res.json()) as { partners?: Partner[] };
      return data.partners ?? [];
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}
