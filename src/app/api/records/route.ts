import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateWaterBill } from "@/lib/calculations";

// Helper to find previous month string (e.g., "2026-10" -> "2026-09")
function getPreviousMonthString(billingMonth: string): string {
  const [yearStr, monthStr] = billingMonth.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const records = await prisma.monthRecord.findMany({
      orderBy: { billingMonth: "desc" },
    });

    let settings = await prisma.tenantSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json({ records, settings });
  } catch (error) {
    console.error("Failed to fetch records:", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      billingMonth,
      totalMeter,
      floor2Meter,
      totalBill,
      floor1Vacant = false,
      floor2Vacant = false,
      notes,
    } = body;

    if (!billingMonth || totalMeter === undefined || floor2Meter === undefined) {
      return NextResponse.json(
        { error: "Billing month, total meter, and floor 2 meter are required." },
        { status: 400 }
      );
    }

    // Look for previous month's record to determine baseline readings
    let prevTotalMeter: number | null = body.prevTotalMeter ?? null;
    let prevFloor2Meter: number | null = body.prevFloor2Meter ?? null;

    if (prevTotalMeter === null || prevFloor2Meter === null) {
      const prevMonthStr = getPreviousMonthString(billingMonth);
      const prevRecord = await prisma.monthRecord.findUnique({
        where: { billingMonth: prevMonthStr },
      });
      if (prevRecord) {
        if (prevTotalMeter === null) prevTotalMeter = prevRecord.totalMeter;
        if (prevFloor2Meter === null) prevFloor2Meter = prevRecord.floor2Meter;
      }
    }

    const billAmount =
      totalBill !== undefined && totalBill !== null && totalBill !== ""
        ? parseFloat(totalBill)
        : null;

    const calcResult = calculateWaterBill({
      totalMeter: parseFloat(totalMeter),
      floor2Meter: parseFloat(floor2Meter),
      prevTotalMeter,
      prevFloor2Meter,
      totalBill: billAmount,
      floor1Vacant: Boolean(floor1Vacant),
      floor2Vacant: Boolean(floor2Vacant),
    });

    const now = new Date();
    const existing = await prisma.monthRecord.findUnique({
      where: { billingMonth },
    });

    const record = await prisma.monthRecord.upsert({
      where: { billingMonth },
      create: {
        billingMonth,
        totalMeter: parseFloat(totalMeter),
        floor2Meter: parseFloat(floor2Meter),
        prevTotalMeter,
        prevFloor2Meter,
        totalUsage: calcResult.totalUsage,
        floor2Usage: calcResult.floor2Usage,
        floor1Usage: calcResult.floor1Usage,
        totalBill: billAmount,
        floor1Vacant: Boolean(floor1Vacant),
        floor2Vacant: Boolean(floor2Vacant),
        floor1Ratio: calcResult.floor1Ratio,
        floor2Ratio: calcResult.floor2Ratio,
        floor1Cost: calcResult.floor1Cost,
        floor2Cost: calcResult.floor2Cost,
        status: calcResult.status,
        notes: notes ?? null,
        readingsEnteredAt: now,
        billEnteredAt: billAmount !== null ? now : null,
      },
      update: {
        totalMeter: parseFloat(totalMeter),
        floor2Meter: parseFloat(floor2Meter),
        prevTotalMeter,
        prevFloor2Meter,
        totalUsage: calcResult.totalUsage,
        floor2Usage: calcResult.floor2Usage,
        floor1Usage: calcResult.floor1Usage,
        totalBill: billAmount,
        floor1Vacant: Boolean(floor1Vacant),
        floor2Vacant: Boolean(floor2Vacant),
        floor1Ratio: calcResult.floor1Ratio,
        floor2Ratio: calcResult.floor2Ratio,
        floor1Cost: calcResult.floor1Cost,
        floor2Cost: calcResult.floor2Cost,
        status: existing?.status === "NOTIFIED" && billAmount === existing.totalBill ? "NOTIFIED" : calcResult.status,
        notes: notes ?? existing?.notes,
        readingsEnteredAt: existing?.readingsEnteredAt ?? now,
        billEnteredAt: billAmount !== null ? existing?.billEnteredAt ?? now : null,
      },
    });

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Failed to save month record:", error);
    return NextResponse.json({ error: "Failed to save record" }, { status: 500 });
  }
}
