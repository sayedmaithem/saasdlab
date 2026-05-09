export const supportedLocales = ["en", "ar"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en";

export const localeDirections: Record<SupportedLocale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
};
