/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CountryCodeInfo {
  code: string;       // ISO country code (e.g. "ZW")
  name: string;       // Country Name (e.g. "Zimbabwe")
  dialCode: string;   // Dialing Code (e.g. "+263")
  flag: string;       // Flag emoji (e.g. "🇿🇼")
  localLengthMin: number;
  localLengthMax: number;
}

export const COUNTRY_CODES: CountryCodeInfo[] = [
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼', localLengthMin: 8, localLengthMax: 10 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', localLengthMin: 9, localLengthMax: 10 },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲', localLengthMin: 9, localLengthMax: 10 },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼', localLengthMin: 7, localLengthMax: 8 },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿', localLengthMin: 8, localLengthMax: 9 },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦', localLengthMin: 8, localLengthMax: 9 },
  { code: 'MW', name: 'Malawi', dialCode: '+265', flag: '🇲🇼', localLengthMin: 8, localLengthMax: 9 },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', localLengthMin: 9, localLengthMax: 10 },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', localLengthMin: 10, localLengthMax: 10 },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', localLengthMin: 9, localLengthMax: 10 },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿', localLengthMin: 9, localLengthMax: 10 },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬', localLengthMin: 9, localLengthMax: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', localLengthMin: 10, localLengthMax: 11 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', localLengthMin: 10, localLengthMax: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', localLengthMin: 10, localLengthMax: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', localLengthMin: 9, localLengthMax: 10 },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', localLengthMin: 10, localLengthMax: 10 },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', localLengthMin: 8, localLengthMax: 9 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', localLengthMin: 9, localLengthMax: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', localLengthMin: 9, localLengthMax: 9 },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', localLengthMin: 11, localLengthMax: 11 },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', localLengthMin: 10, localLengthMax: 11 },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', localLengthMin: 10, localLengthMax: 11 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', localLengthMin: 8, localLengthMax: 10 },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', localLengthMin: 9, localLengthMax: 10 },
];

export const DEFAULT_COUNTRY = COUNTRY_CODES[0]; // Zimbabwe (+263)

/**
 * Normalizes any raw phone input string + selected country dial code into E.164 format (+[countryCode][number])
 */
export function normalizePhoneNumber(rawInput: string, selectedDialCode: string = '+263'): string {
  if (!rawInput) return '';

  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  // 1. If explicit leading '+'
  if (trimmed.startsWith('+')) {
    const digitsOnly = trimmed.slice(1).replace(/\D/g, '');
    return digitsOnly ? `+${digitsOnly}` : '';
  }

  // Clean all non-digits
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  const selectedCodeDigits = selectedDialCode.replace(/\D/g, '');

  // 2. Check if input already starts with the selected country dial code digits (e.g. "263771234567")
  if (selectedCodeDigits && digits.startsWith(selectedCodeDigits) && digits.length >= selectedCodeDigits.length + 6) {
    return `+${digits}`;
  }

  // Check if raw input starts with any other known dial code digits (e.g. "27821234567" or "447700900077")
  const matchingCountry = COUNTRY_CODES.find(c => {
    const codeDigits = c.dialCode.replace(/\D/g, '');
    return codeDigits.length > 1 && digits.startsWith(codeDigits) && digits.length >= codeDigits.length + 6;
  });

  if (matchingCountry) {
    return `+${digits}`;
  }

  // 3. If input starts with '0' (e.g. "0771234567" or "0771 234 567")
  if (digits.startsWith('0')) {
    const localPart = digits.replace(/^0+/, '');
    return `${selectedDialCode}${localPart}`;
  }

  // 4. Default: attach selected country dial code
  return `${selectedDialCode}${digits}`;
}

/**
 * Validates whether a phone number is valid for the selected country.
 */
export function validatePhoneNumber(rawInput: string, country: CountryCodeInfo): { isValid: boolean; normalized: string; error?: string } {
  const normalized = normalizePhoneNumber(rawInput, country.dialCode);

  if (!normalized || normalized.length < 8) {
    return {
      isValid: false,
      normalized,
      error: `Please enter a valid phone number for ${country.name}.`
    };
  }

  const dialCodeDigits = country.dialCode.replace(/\D/g, '');
  const normDigits = normalized.slice(1); // strip leading '+'

  if (!normDigits.startsWith(dialCodeDigits)) {
    // Differs from selected dial code (e.g. user entered explicit +27 while +263 was selected)
    if (normDigits.length < 8 || normDigits.length > 15) {
      return {
        isValid: false,
        normalized,
        error: `Please enter a valid phone number for ${country.name}.`
      };
    }
    return { isValid: true, normalized };
  }

  const localDigits = normDigits.slice(dialCodeDigits.length);

  if (localDigits.length < country.localLengthMin || localDigits.length > country.localLengthMax) {
    return {
      isValid: false,
      normalized,
      error: `Please enter a valid phone number for ${country.name}.`
    };
  }

  return { isValid: true, normalized };
}

/**
 * Parses an existing phone string to extract best-matched CountryCodeInfo and local display portion.
 */
export function parsePhoneForDisplay(storedPhone: string): { country: CountryCodeInfo; localPart: string } {
  if (!storedPhone) {
    return { country: DEFAULT_COUNTRY, localPart: '' };
  }

  const normalized = normalizePhoneNumber(storedPhone, DEFAULT_COUNTRY.dialCode);

  if (normalized.startsWith('+')) {
    const digits = normalized.slice(1);
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      const codeDigits = c.dialCode.replace(/\D/g, '');
      if (digits.startsWith(codeDigits)) {
        const local = digits.slice(codeDigits.length);
        return { country: c, localPart: local };
      }
    }
  }

  return { country: DEFAULT_COUNTRY, localPart: storedPhone.replace(/\D/g, '') };
}
