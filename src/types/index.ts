export interface MonthRecord {
  id: string;
  billingMonth: string;
  totalMeter: number;
  floor2Meter: number;
  prevTotalMeter?: number | null;
  prevFloor2Meter?: number | null;
  totalUsage?: number | null;
  floor2Usage?: number | null;
  floor1Usage?: number | null;
  totalBill?: number | null;
  floor1Vacant: boolean;
  floor2Vacant: boolean;
  floor1Ratio?: number | null;
  floor2Ratio?: number | null;
  floor1Cost?: number | null;
  floor2Cost?: number | null;
  status: "READINGS_ENTERED" | "READY" | "NOTIFIED" | string;
  notes?: string | null;
  readingsEnteredAt?: string | null;
  billEnteredAt?: string | null;
  floor1NotifiedAt?: string | null;
  floor2NotifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  id: string;
  unit1Name: string;
  unit1Email?: string | null;
  unit1Phone?: string | null;
  unit1Carrier?: string | null;
  unit1NotifyEmail: boolean;
  unit1NotifySms: boolean;
  unit2Name: string;
  unit2Email?: string | null;
  unit2Phone?: string | null;
  unit2Carrier?: string | null;
  unit2NotifyEmail: boolean;
  unit2NotifySms: boolean;
  senderEmail?: string | null;
}
