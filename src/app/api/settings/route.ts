import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    let settings = await prisma.tenantSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      unit1Name,
      unit1Email,
      unit1Phone,
      unit1Carrier,
      unit1NotifyEmail,
      unit1NotifySms,
      unit2Name,
      unit2Email,
      unit2Phone,
      unit2Carrier,
      unit2NotifyEmail,
      unit2NotifySms,
      senderEmail,
    } = body;

    const settings = await prisma.tenantSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        unit1Name: unit1Name ?? "Apartment 1 (1st Floor)",
        unit1Email: unit1Email || null,
        unit1Phone: unit1Phone || null,
        unit1Carrier: unit1Carrier || null,
        unit1NotifyEmail: Boolean(unit1NotifyEmail),
        unit1NotifySms: Boolean(unit1NotifySms),
        unit2Name: unit2Name ?? "Apartment 2 (2nd Floor)",
        unit2Email: unit2Email || null,
        unit2Phone: unit2Phone || null,
        unit2Carrier: unit2Carrier || null,
        unit2NotifyEmail: Boolean(unit2NotifyEmail),
        unit2NotifySms: Boolean(unit2NotifySms),
        senderEmail: senderEmail || "water@dish.place",
      },
      update: {
        unit1Name: unit1Name ?? undefined,
        unit1Email: unit1Email || null,
        unit1Phone: unit1Phone || null,
        unit1Carrier: unit1Carrier || null,
        unit1NotifyEmail: Boolean(unit1NotifyEmail),
        unit1NotifySms: Boolean(unit1NotifySms),
        unit2Name: unit2Name ?? undefined,
        unit2Email: unit2Email || null,
        unit2Phone: unit2Phone || null,
        unit2Carrier: unit2Carrier || null,
        unit2NotifyEmail: Boolean(unit2NotifyEmail),
        unit2NotifySms: Boolean(unit2NotifySms),
        senderEmail: senderEmail || "water@dish.place",
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
