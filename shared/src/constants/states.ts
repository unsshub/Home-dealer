export interface StateDefaults {
  name: string;
  propertyTaxRate: number;
  insuranceRate: number;
}

export const STATE_DEFAULTS: Record<string, StateDefaults> = {
  AL: { name: 'Alabama', propertyTaxRate: 0.004, insuranceRate: 0.0050 },
  AK: { name: 'Alaska', propertyTaxRate: 0.010, insuranceRate: 0.0045 },
  AZ: { name: 'Arizona', propertyTaxRate: 0.006, insuranceRate: 0.0045 },
  AR: { name: 'Arkansas', propertyTaxRate: 0.006, insuranceRate: 0.0055 },
  CA: { name: 'California', propertyTaxRate: 0.0076, insuranceRate: 0.0040 },
  CO: { name: 'Colorado', propertyTaxRate: 0.005, insuranceRate: 0.0050 },
  CT: { name: 'Connecticut', propertyTaxRate: 0.017, insuranceRate: 0.0050 },
  DE: { name: 'Delaware', propertyTaxRate: 0.005, insuranceRate: 0.0050 },
  FL: { name: 'Florida', propertyTaxRate: 0.009, insuranceRate: 0.0075 },
  GA: { name: 'Georgia', propertyTaxRate: 0.009, insuranceRate: 0.0055 },
  HI: { name: 'Hawaii', propertyTaxRate: 0.003, insuranceRate: 0.0030 },
  ID: { name: 'Idaho', propertyTaxRate: 0.007, insuranceRate: 0.0045 },
  IL: { name: 'Illinois', propertyTaxRate: 0.020, insuranceRate: 0.0050 },
  IN: { name: 'Indiana', propertyTaxRate: 0.008, insuranceRate: 0.0050 },
  IA: { name: 'Iowa', propertyTaxRate: 0.013, insuranceRate: 0.0050 },
  KS: { name: 'Kansas', propertyTaxRate: 0.013, insuranceRate: 0.0055 },
  KY: { name: 'Kentucky', propertyTaxRate: 0.008, insuranceRate: 0.0055 },
  LA: { name: 'Louisiana', propertyTaxRate: 0.005, insuranceRate: 0.0070 },
  ME: { name: 'Maine', propertyTaxRate: 0.012, insuranceRate: 0.0045 },
  MD: { name: 'Maryland', propertyTaxRate: 0.010, insuranceRate: 0.0050 },
  MA: { name: 'Massachusetts', propertyTaxRate: 0.012, insuranceRate: 0.0050 },
  MI: { name: 'Michigan', propertyTaxRate: 0.013, insuranceRate: 0.0055 },
  MN: { name: 'Minnesota', propertyTaxRate: 0.011, insuranceRate: 0.0045 },
  MS: { name: 'Mississippi', propertyTaxRate: 0.007, insuranceRate: 0.0060 },
  MO: { name: 'Missouri', propertyTaxRate: 0.009, insuranceRate: 0.0055 },
  MT: { name: 'Montana', propertyTaxRate: 0.008, insuranceRate: 0.0050 },
  NE: { name: 'Nebraska', propertyTaxRate: 0.015, insuranceRate: 0.0050 },
  NV: { name: 'Nevada', propertyTaxRate: 0.006, insuranceRate: 0.0045 },
  NH: { name: 'New Hampshire', propertyTaxRate: 0.018, insuranceRate: 0.0050 },
  NJ: { name: 'New Jersey', propertyTaxRate: 0.023, insuranceRate: 0.0045 },
  NM: { name: 'New Mexico', propertyTaxRate: 0.008, insuranceRate: 0.0055 },
  NY: { name: 'New York', propertyTaxRate: 0.015, insuranceRate: 0.0050 },
  NC: { name: 'North Carolina', propertyTaxRate: 0.007, insuranceRate: 0.0050 },
  ND: { name: 'North Dakota', propertyTaxRate: 0.009, insuranceRate: 0.0050 },
  OH: { name: 'Ohio', propertyTaxRate: 0.014, insuranceRate: 0.0055 },
  OK: { name: 'Oklahoma', propertyTaxRate: 0.008, insuranceRate: 0.0060 },
  OR: { name: 'Oregon', propertyTaxRate: 0.009, insuranceRate: 0.0045 },
  PA: { name: 'Pennsylvania', propertyTaxRate: 0.014, insuranceRate: 0.0050 },
  RI: { name: 'Rhode Island', propertyTaxRate: 0.014, insuranceRate: 0.0050 },
  SC: { name: 'South Carolina', propertyTaxRate: 0.005, insuranceRate: 0.0060 },
  SD: { name: 'South Dakota', propertyTaxRate: 0.012, insuranceRate: 0.0050 },
  TN: { name: 'Tennessee', propertyTaxRate: 0.006, insuranceRate: 0.0055 },
  TX: { name: 'Texas', propertyTaxRate: 0.016, insuranceRate: 0.0065 },
  UT: { name: 'Utah', propertyTaxRate: 0.006, insuranceRate: 0.0045 },
  VT: { name: 'Vermont', propertyTaxRate: 0.016, insuranceRate: 0.0045 },
  VA: { name: 'Virginia', propertyTaxRate: 0.008, insuranceRate: 0.0050 },
  WA: { name: 'Washington', propertyTaxRate: 0.009, insuranceRate: 0.0045 },
  WV: { name: 'West Virginia', propertyTaxRate: 0.005, insuranceRate: 0.0055 },
  WI: { name: 'Wisconsin', propertyTaxRate: 0.015, insuranceRate: 0.0050 },
  WY: { name: 'Wyoming', propertyTaxRate: 0.006, insuranceRate: 0.0050 },
};

export function getStateDefaults(stateCode: string): StateDefaults | null {
  return STATE_DEFAULTS[stateCode.toUpperCase()] ?? null;
}
