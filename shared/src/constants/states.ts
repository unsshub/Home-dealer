export interface StateDefaults {
  name: string;
  propertyTaxRate: number;
  insuranceRate: number;
}

export const STATE_DEFAULTS: Record<string, StateDefaults> = {
  AL: { name: 'Alabama', propertyTaxRate: 0.4, insuranceRate: 0.50 },
  AK: { name: 'Alaska', propertyTaxRate: 1.0, insuranceRate: 0.45 },
  AZ: { name: 'Arizona', propertyTaxRate: 0.6, insuranceRate: 0.45 },
  AR: { name: 'Arkansas', propertyTaxRate: 0.6, insuranceRate: 0.55 },
  CA: { name: 'California', propertyTaxRate: 0.76, insuranceRate: 0.40 },
  CO: { name: 'Colorado', propertyTaxRate: 0.5, insuranceRate: 0.50 },
  CT: { name: 'Connecticut', propertyTaxRate: 1.7, insuranceRate: 0.50 },
  DE: { name: 'Delaware', propertyTaxRate: 0.5, insuranceRate: 0.50 },
  FL: { name: 'Florida', propertyTaxRate: 0.9, insuranceRate: 0.75 },
  GA: { name: 'Georgia', propertyTaxRate: 0.9, insuranceRate: 0.55 },
  HI: { name: 'Hawaii', propertyTaxRate: 0.3, insuranceRate: 0.30 },
  ID: { name: 'Idaho', propertyTaxRate: 0.7, insuranceRate: 0.45 },
  IL: { name: 'Illinois', propertyTaxRate: 2.0, insuranceRate: 0.50 },
  IN: { name: 'Indiana', propertyTaxRate: 0.8, insuranceRate: 0.50 },
  IA: { name: 'Iowa', propertyTaxRate: 1.3, insuranceRate: 0.50 },
  KS: { name: 'Kansas', propertyTaxRate: 1.3, insuranceRate: 0.55 },
  KY: { name: 'Kentucky', propertyTaxRate: 0.8, insuranceRate: 0.55 },
  LA: { name: 'Louisiana', propertyTaxRate: 0.5, insuranceRate: 0.70 },
  ME: { name: 'Maine', propertyTaxRate: 1.2, insuranceRate: 0.45 },
  MD: { name: 'Maryland', propertyTaxRate: 1.0, insuranceRate: 0.50 },
  MA: { name: 'Massachusetts', propertyTaxRate: 1.2, insuranceRate: 0.50 },
  MI: { name: 'Michigan', propertyTaxRate: 1.3, insuranceRate: 0.55 },
  MN: { name: 'Minnesota', propertyTaxRate: 1.1, insuranceRate: 0.45 },
  MS: { name: 'Mississippi', propertyTaxRate: 0.7, insuranceRate: 0.60 },
  MO: { name: 'Missouri', propertyTaxRate: 0.9, insuranceRate: 0.55 },
  MT: { name: 'Montana', propertyTaxRate: 0.8, insuranceRate: 0.50 },
  NE: { name: 'Nebraska', propertyTaxRate: 1.5, insuranceRate: 0.50 },
  NV: { name: 'Nevada', propertyTaxRate: 0.6, insuranceRate: 0.45 },
  NH: { name: 'New Hampshire', propertyTaxRate: 1.8, insuranceRate: 0.50 },
  NJ: { name: 'New Jersey', propertyTaxRate: 2.3, insuranceRate: 0.45 },
  NM: { name: 'New Mexico', propertyTaxRate: 0.8, insuranceRate: 0.55 },
  NY: { name: 'New York', propertyTaxRate: 1.5, insuranceRate: 0.50 },
  NC: { name: 'North Carolina', propertyTaxRate: 0.7, insuranceRate: 0.50 },
  ND: { name: 'North Dakota', propertyTaxRate: 0.9, insuranceRate: 0.50 },
  OH: { name: 'Ohio', propertyTaxRate: 1.4, insuranceRate: 0.55 },
  OK: { name: 'Oklahoma', propertyTaxRate: 0.8, insuranceRate: 0.60 },
  OR: { name: 'Oregon', propertyTaxRate: 0.9, insuranceRate: 0.45 },
  PA: { name: 'Pennsylvania', propertyTaxRate: 1.4, insuranceRate: 0.50 },
  RI: { name: 'Rhode Island', propertyTaxRate: 1.4, insuranceRate: 0.50 },
  SC: { name: 'South Carolina', propertyTaxRate: 0.5, insuranceRate: 0.60 },
  SD: { name: 'South Dakota', propertyTaxRate: 1.2, insuranceRate: 0.50 },
  TN: { name: 'Tennessee', propertyTaxRate: 0.6, insuranceRate: 0.55 },
  TX: { name: 'Texas', propertyTaxRate: 1.6, insuranceRate: 0.65 },
  UT: { name: 'Utah', propertyTaxRate: 0.6, insuranceRate: 0.45 },
  VT: { name: 'Vermont', propertyTaxRate: 1.6, insuranceRate: 0.45 },
  VA: { name: 'Virginia', propertyTaxRate: 0.8, insuranceRate: 0.50 },
  WA: { name: 'Washington', propertyTaxRate: 0.9, insuranceRate: 0.45 },
  WV: { name: 'West Virginia', propertyTaxRate: 0.5, insuranceRate: 0.55 },
  WI: { name: 'Wisconsin', propertyTaxRate: 1.5, insuranceRate: 0.50 },
  WY: { name: 'Wyoming', propertyTaxRate: 0.6, insuranceRate: 0.50 },
};

export function getStateDefaults(stateCode: string): StateDefaults | null {
  return STATE_DEFAULTS[stateCode.toUpperCase()] ?? null;
}
