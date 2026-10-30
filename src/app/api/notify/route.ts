import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import {
  getEmailToSmsAddress,
  formatSmsMessage,
  formatEmailMessage,
  BillNotificationMessageData,
} from "@/lib/carriers";

function formatMonthReadable(billingMonth: string): string {
  const [yearStr, monthStr] = billingMonth.split("-");
  const monthNum = parseInt(monthStr, 10);
  const date = new Date(parseInt(yearStr, 10), monthNum - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { recordId, sendUnit1 = true, sendUnit2 = true } = body;

    if (!recordId) {
      return NextResponse.json({ error: "Record ID is required." }, { status: 400 });
    }

    const record = await prisma.monthRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }

    if (record.totalBill === null || record.totalBill === undefined) {
      return NextResponse.json(
        { error: "Cannot send notification before total bill amount is entered." },
        { status: 400 }
      );
    }

    let settings = await prisma.tenantSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.tenantSettings.create({
        data: { id: "default" },
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const isConfigured = Boolean(apiKey && apiKey.trim().length > 0 && !apiKey.includes("123456789"));
    const resend = isConfigured ? new Resend(apiKey) : null;
    const senderEmail = settings.senderEmail || process.env.SENDER_EMAIL || "water@dish.place";

    const monthReadable = formatMonthReadable(record.billingMonth);
    const results: Array<{
      unit: string;
      channel: "email" | "sms";
      to: string;
      status: "sent" | "simulated" | "failed" | "skipped";
      message?: string;
    }> = [];

    const now = new Date();
    let updatedFloor1Notified = record.floor1NotifiedAt;
    let updatedFloor2Notified = record.floor2NotifiedAt;

    // --- UNIT 1 DISPATCH ---
    if (sendUnit1 && !record.floor1Vacant && record.floor1Cost !== null) {
      const unit1Data: BillNotificationMessageData = {
        tenantName: settings.unit1Name,
        monthName: monthReadable,
        apartmentName: "Apartment 1 (1st Floor)",
        cost: record.floor1Cost,
        totalBill: record.totalBill,
        usage: record.floor1Usage,
        totalUsage: record.totalUsage,
        ratio: record.floor1Ratio,
        isVacantOverride: record.floor2Vacant,
      };

      // Email
      if (settings.unit1NotifyEmail && settings.unit1Email) {
        const { subject, html, text } = formatEmailMessage(unit1Data);
        if (resend) {
          try {
            await resend.emails.send({
              from: `Water Billing <${senderEmail}>`,
              to: settings.unit1Email,
              subject,
              html,
              text,
            });
            results.push({ unit: "Unit 1", channel: "email", to: settings.unit1Email, status: "sent" });
          } catch (err: unknown) {
            results.push({
              unit: "Unit 1",
              channel: "email",
              to: settings.unit1Email,
              status: "failed",
              message: (err as Error).message,
            });
          }
        } else {
          results.push({
            unit: "Unit 1",
            channel: "email",
            to: settings.unit1Email,
            status: "simulated",
            message: "RESEND_API_KEY not configured. Preview generated.",
          });
        }
        updatedFloor1Notified = now;
      }

      // SMS via Gateway
      if (settings.unit1NotifySms && settings.unit1Phone && settings.unit1Carrier) {
        const smsAddress = getEmailToSmsAddress(settings.unit1Phone, settings.unit1Carrier);
        if (smsAddress) {
          const smsText = formatSmsMessage(unit1Data);
          if (resend) {
            try {
              await resend.emails.send({
                from: `Water Billing <${senderEmail}>`,
                to: smsAddress,
                subject: "Water Bill",
                text: smsText,
              });
              results.push({ unit: "Unit 1", channel: "sms", to: smsAddress, status: "sent" });
            } catch (err: unknown) {
              results.push({
                unit: "Unit 1",
                channel: "sms",
                to: smsAddress,
                status: "failed",
                message: (err as Error).message,
              });
            }
          } else {
            results.push({
              unit: "Unit 1",
              channel: "sms",
              to: smsAddress,
              status: "simulated",
              message: "RESEND_API_KEY not configured. Preview generated.",
            });
          }
          updatedFloor1Notified = now;
        }
      }
    } else if (record.floor1Vacant) {
      results.push({
        unit: "Unit 1",
        channel: "email",
        to: "N/A",
        status: "skipped",
        message: "Unit 1 is marked as vacant.",
      });
    }

    // --- UNIT 2 DISPATCH ---
    if (sendUnit2 && !record.floor2Vacant && record.floor2Cost !== null) {
      const unit2Data: BillNotificationMessageData = {
        tenantName: settings.unit2Name,
        monthName: monthReadable,
        apartmentName: "Apartment 2 (2nd Floor)",
        cost: record.floor2Cost,
        totalBill: record.totalBill,
        usage: record.floor2Usage,
        totalUsage: record.totalUsage,
        ratio: record.floor2Ratio,
        isVacantOverride: record.floor1Vacant,
      };

      // Email
      if (settings.unit2NotifyEmail && settings.unit2Email) {
        const { subject, html, text } = formatEmailMessage(unit2Data);
        if (resend) {
          try {
            await resend.emails.send({
              from: `Water Billing <${senderEmail}>`,
              to: settings.unit2Email,
              subject,
              html,
              text,
            });
            results.push({ unit: "Unit 2", channel: "email", to: settings.unit2Email, status: "sent" });
          } catch (err: unknown) {
            results.push({
              unit: "Unit 2",
              channel: "email",
              to: settings.unit2Email,
              status: "failed",
              message: (err as Error).message,
            });
          }
        } else {
          results.push({
            unit: "Unit 2",
            channel: "email",
            to: settings.unit2Email,
            status: "simulated",
            message: "RESEND_API_KEY not configured. Preview generated.",
          });
        }
        updatedFloor2Notified = now;
      }

      // SMS via Gateway
      if (settings.unit2NotifySms && settings.unit2Phone && settings.unit2Carrier) {
        const smsAddress = getEmailToSmsAddress(settings.unit2Phone, settings.unit2Carrier);
        if (smsAddress) {
          const smsText = formatSmsMessage(unit2Data);
          if (resend) {
            try {
              await resend.emails.send({
                from: `Water Billing <${senderEmail}>`,
                to: smsAddress,
                subject: "Water Bill",
                text: smsText,
              });
              results.push({ unit: "Unit 2", channel: "sms", to: smsAddress, status: "sent" });
            } catch (err: unknown) {
              results.push({
                unit: "Unit 2",
                channel: "sms",
                to: smsAddress,
                status: "failed",
                message: (err as Error).message,
              });
            }
          } else {
            results.push({
              unit: "Unit 2",
              channel: "sms",
              to: smsAddress,
              status: "simulated",
              message: "RESEND_API_KEY not configured. Preview generated.",
            });
          }
          updatedFloor2Notified = now;
        }
      }
    } else if (record.floor2Vacant) {
      results.push({
        unit: "Unit 2",
        channel: "email",
        to: "N/A",
        status: "skipped",
        message: "Unit 2 is marked as vacant.",
      });
    }

    // Update record state to NOTIFIED
    const updatedRecord = await prisma.monthRecord.update({
      where: { id: record.id },
      data: {
        status: "NOTIFIED",
        floor1NotifiedAt: updatedFloor1Notified,
        floor2NotifiedAt: updatedFloor2Notified,
      },
    });

    return NextResponse.json({
      success: true,
      simulated: !isConfigured,
      results,
      record: updatedRecord,
    });
  } catch (error) {
    console.error("Failed to notify tenants:", error);
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 });
  }
}
