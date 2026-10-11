import arMessages from "./messages/ar.json";
import enMessages from "./messages/en.json";

export type Locale = "ar" | "en";
export const DEFAULT_LOCALE: Locale = "ar";

const messages: Record<Locale, Record<string, any>> = {
  ar: arMessages,
  en: enMessages,
};

/**
 * Resolve a nested key from an object using dot notation (e.g., 'common.welcome')
 */
function resolveKey(obj: Record<string, any>, path: string): string | undefined {
  const parts = path.split(".");
  let current: any = obj;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Translate a message key into the target locale (defaults to Arabic 'ar').
 * Replaces parameters formatted as {param}.
 */
export function t(
  key: string,
  params?: Record<string, string | number>,
  locale: Locale = DEFAULT_LOCALE
): string {
  const dict = messages[locale] || messages[DEFAULT_LOCALE];
  let text = resolveKey(dict, key);

  if (!text && locale !== DEFAULT_LOCALE) {
    text = resolveKey(messages[DEFAULT_LOCALE], key);
  }

  if (!text) {
    return key;
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return text;
}
