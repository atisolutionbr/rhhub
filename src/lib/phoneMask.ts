import { countries, getCountryByCode } from "./locations";

export function maskPhone(digits: string, countryCode: string): string {
  const country = getCountryByCode(countryCode) || countries[0];
  const dialCode = country.dialCode;
  const d = digits.replace(/\D/g, "");

  if (country.code === "BR") {
    if (d.length <= 2) return `+55 ${d}`;
    if (d.length <= 6) return `+55 (${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `+55 (${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `+55 (${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
  }

  if (country.code === "PT" || country.code === "ES") {
    if (d.length <= 3) return `${dialCode} ${d}`;
    if (d.length <= 6) return `${dialCode} ${d.slice(0, 3)} ${d.slice(3)}`;
    return `${dialCode} ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
  }

  if (country.code === "US" || country.code === "CA") {
    if (d.length <= 3) return `+1 ${d}`;
    if (d.length <= 6) return `+1 (${d.slice(0, 3)}) ${d.slice(3)}`;
    return `+1 (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
  }

  // Generic: group in blocks of 3-4
  const groups: string[] = [];
  let remaining = d;
  while (remaining.length > 0) {
    groups.push(remaining.slice(0, 4));
    remaining = remaining.slice(4);
  }
  return `${dialCode} ${groups.join(" ")}`.trim();
}

export function formatPhoneInput(value: string, countryCode: string): string {
  const country = getCountryByCode(countryCode) || countries[0];
  const dialCode = country.dialCode;

  // Strip everything
  let raw = value.replace(/\D/g, "");

  // Remove leading dial code digits if user typed them
  const dialDigits = dialCode.replace(/\D/g, "");
  if (raw.startsWith(dialDigits)) {
    raw = raw.slice(dialDigits.length);
  }

  // Limit to reasonable length
  const maxLen = country.code === "BR" ? 11 : country.code === "US" || country.code === "CA" ? 10 : 12;
  raw = raw.slice(0, maxLen);

  return maskPhone(raw, countryCode);
}

export function stripPhoneDisplay(display: string): string {
  return display.replace(/\D/g, "");
}
