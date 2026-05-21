export const defaultWorkTypes = ["Zircon", "Emax", "Implant", "Night Guard", "Denture", "Other"];

export const defaultMaterials = [
  { name: "Zirconia", defaultPrice: 0, active: true },
  { name: "Emax", defaultPrice: 0, active: true },
  { name: "PMMA", defaultPrice: 0, active: true },
  { name: "Titanium", defaultPrice: 0, active: true },
];

export const defaultQcSettings = [
  { workType: "Zircon", item: "Shade checked", required: true, active: true },
  { workType: "Zircon", item: "Margin checked", required: true, active: true },
  { workType: "Emax", item: "Translucency checked", required: true, active: true },
  { workType: "Implant", item: "Passive fit checked", required: true, active: true },
];
