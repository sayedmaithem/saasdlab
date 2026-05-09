export const supportedDirections = ["ltr", "rtl"] as const;
export type UiDirection = (typeof supportedDirections)[number];

export const uiLabels = {
  en: {
    dashboard: "Dashboard",
    cases: "Cases",
    finance: "Finance",
    delivery: "Delivery",
    settings: "Settings",
  },
  ar: {
    dashboard: "لوحة التحكم",
    cases: "الحالات",
    finance: "المالية",
    delivery: "التوصيل",
    settings: "الإعدادات",
  },
} as const;
