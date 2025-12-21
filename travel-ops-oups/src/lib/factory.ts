export type BriefReadiness = {
  ready: boolean;
  issues: string[];
};

const REQUIRED_FIELDS = [
  "productName",
  "targetSegment",
  "durationDays",
  "budgetPerPax",
  "heroDestination",
  "valueProps",
  "itineraryOutline",
  "suppliers",
  "pricingAssumptions",
];

export function checkBriefReadiness(brief: Record<string, unknown> | null | undefined): BriefReadiness {
  const issues: string[] = [];
  if (!brief) {
    return { ready: false, issues: ["Brief is missing"] };
  }
  for (const field of REQUIRED_FIELDS) {
    const value = brief[field];
    const isEmptyArray = Array.isArray(value) && value.length === 0;
    if (value === undefined || value === null || value === "" || isEmptyArray) {
      issues.push(`${field} is required`);
    }
  }
  return { ready: issues.length === 0, issues };
}
