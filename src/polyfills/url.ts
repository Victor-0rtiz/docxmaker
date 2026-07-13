/**
 * Minimal URL polyfill for browser environments.
 *
 * @oozcitak/url (used internally by xmlbuilder2) calls Node's
 * `url.domainToASCII` and `url.domainToUnicode` when parsing
 * internationalized domain names. In practice these are never
 * reached during DOCX generation, so simple identity functions
 * are sufficient as polyfills.
 */
export function domainToASCII(domain: string): string {
  return domain;
}

export function domainToUnicode(domain: string): string {
  return domain;
}
