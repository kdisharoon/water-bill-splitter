export interface CalculationInput {
  totalMeter: number;
  floor2Meter: number;
  prevTotalMeter?: number | null;
  prevFloor2Meter?: number | null;
  totalBill?: number | null;
  floor1Vacant?: boolean;
  floor2Vacant?: boolean;
}

export interface CalculationResult {
  totalUsage: number | null;
  floor2Usage: number | null;
  floor1Usage: number | null;
  floor1Ratio: number | null; // 0.000 to 1.000
  floor2Ratio: number | null; // 0.000 to 1.000
  floor1Cost: number | null;  // Dollar amount
  floor2Cost: number | null;  // Dollar amount
  status: "READINGS_ENTERED" | "READY";
  notes?: string;
}

/**
 * Calculates water consumption deltas and proportional costs
 * accounting for tenant vacancy overrides.
 */
export function calculateWaterBill(input: CalculationInput): CalculationResult {
  const {
    totalMeter,
    floor2Meter,
    prevTotalMeter,
    prevFloor2Meter,
    totalBill,
    floor1Vacant = false,
    floor2Vacant = false,
  } = input;

  const hasPreviousReadings =
    prevTotalMeter !== undefined &&
    prevTotalMeter !== null &&
    prevFloor2Meter !== undefined &&
    prevFloor2Meter !== null;

  let totalUsage: number | null = null;
  let floor2Usage: number | null = null;
  let floor1Usage: number | null = null;

  if (hasPreviousReadings) {
    totalUsage = Math.max(0, +(totalMeter - prevTotalMeter).toFixed(2));
    floor2Usage = Math.max(0, +(floor2Meter - prevFloor2Meter).toFixed(2));
    floor1Usage = Math.max(0, +(totalUsage - floor2Usage).toFixed(2));
  }

  // If no bill entered yet, we only have meter readings
  if (totalBill === undefined || totalBill === null || isNaN(totalBill)) {
    let floor1Ratio: number | null = null;
    let floor2Ratio: number | null = null;

    if (floor1Vacant && !floor2Vacant) {
      floor1Ratio = 0;
      floor2Ratio = 1;
    } else if (floor2Vacant && !floor1Vacant) {
      floor1Ratio = 1;
      floor2Ratio = 0;
    } else if (totalUsage && totalUsage > 0 && floor1Usage !== null && floor2Usage !== null) {
      floor2Ratio = +(floor2Usage / totalUsage).toFixed(4);
      floor1Ratio = +(floor1Usage / totalUsage).toFixed(4);
    }

    return {
      totalUsage,
      floor2Usage,
      floor1Usage,
      floor1Ratio,
      floor2Ratio,
      floor1Cost: null,
      floor2Cost: null,
      status: "READINGS_ENTERED",
    };
  }

  const bill = Math.max(0, +totalBill.toFixed(2));

  // Vacancy case 1: Both vacant
  if (floor1Vacant && floor2Vacant) {
    const half = Math.round((bill / 2) * 100) / 100;
    const otherHalf = +(bill - half).toFixed(2);
    return {
      totalUsage,
      floor2Usage,
      floor1Usage,
      floor1Ratio: 0.5,
      floor2Ratio: 0.5,
      floor1Cost: half,
      floor2Cost: otherHalf,
      status: "READY",
      notes: "Both apartments indicated as vacant. Split 50/50.",
    };
  }

  // Vacancy case 2: Floor 1 vacant -> Floor 2 pays 100%
  if (floor1Vacant) {
    return {
      totalUsage,
      floor2Usage,
      floor1Usage,
      floor1Ratio: 0,
      floor2Ratio: 1,
      floor1Cost: 0,
      floor2Cost: bill,
      status: "READY",
      notes: "Floor 1 vacant. 100% of bill allocated to Floor 2.",
    };
  }

  // Vacancy case 3: Floor 2 vacant -> Floor 1 pays 100%
  if (floor2Vacant) {
    return {
      totalUsage,
      floor2Usage,
      floor1Usage,
      floor1Ratio: 1,
      floor2Ratio: 0,
      floor1Cost: bill,
      floor2Cost: 0,
      status: "READY",
      notes: "Floor 2 vacant. 100% of bill allocated to Floor 1.",
    };
  }

  // Both occupied: Proportional based on water consumption
  if (totalUsage && totalUsage > 0 && floor1Usage !== null && floor2Usage !== null) {
    const floor2Ratio = floor2Usage / totalUsage;
    const floor1Ratio = floor1Usage / totalUsage;

    // Floor 2 cost rounded to cents
    const floor2Cost = Math.round(bill * floor2Ratio * 100) / 100;
    // Floor 1 pays remainder to avoid penny discrepancy
    const floor1Cost = +(bill - floor2Cost).toFixed(2);

    return {
      totalUsage,
      floor2Usage,
      floor1Usage,
      floor1Ratio: +floor1Ratio.toFixed(4),
      floor2Ratio: +floor2Ratio.toFixed(4),
      floor1Cost,
      floor2Cost,
      status: "READY",
    };
  }

  // Fallback if no usage delta available or usage was 0: 50/50 split
  const f1 = Math.round((bill / 2) * 100) / 100;
  const f2 = +(bill - f1).toFixed(2);

  return {
    totalUsage,
    floor2Usage,
    floor1Usage,
    floor1Ratio: 0.5,
    floor2Ratio: 0.5,
    floor1Cost: f1,
    floor2Cost: f2,
    status: "READY",
    notes: "Zero or no previous usage delta found. Split 50/50.",
  };
}
