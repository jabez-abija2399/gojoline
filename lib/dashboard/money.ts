/**
 * A price in Birr the way the site shows it ("1,250 Birr", "45.50 ብር"): integer minor units in,
 * whole Birr without decimals, otherwise two. `template` is "{amount} Birr" from the catalog.
 */
export function formatBirr(minor: number, template: string): string {
  const major = minor / 100;
  const digits = Number.isInteger(major) ? 0 : 2;
  const amount = new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: 2 }).format(major);
  return template.replace("{amount}", amount);
}

/** Minor units from what the owner typed ("45.5" → 4550), or null when it isn't a price. */
export function parseBirr(text: string): number | null {
  if (!/^(?=.*\d)\d{0,9}(\.\d{0,2})?$/.test(text)) return null;
  return Math.round(Number(text) * 100);
}
