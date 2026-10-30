"use client";

import { useState } from "react";
import { MonthRecord, TenantSettings } from "@/types";
import { getEmailToSmsAddress, formatSmsMessage, formatEmailMessage } from "@/lib/carriers";
import { X, Send, AlertCircle, CheckCircle2, Smartphone, Mail, Info } from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: MonthRecord;
  settings: TenantSettings;
  onSuccess: (updatedRecord: MonthRecord) => void;
}

function formatMonthReadable(billingMonth: string): string {
  const [yearStr, monthStr] = billingMonth.split("-");
  const monthNum = parseInt(monthStr, 10);
  const date = new Date(parseInt(yearStr, 10), monthNum - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export default function NotificationModal({
  isOpen,
  onClose,
  record,
  settings,
  onSuccess,
}: NotificationModalProps) {
  const [sendUnit1, setSendUnit1] = useState(!record.floor1Vacant);
  const [sendUnit2, setSendUnit2] = useState(!record.floor2Vacant);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Array<{
    unit: string;
    channel: "email" | "sms";
    to: string;
    status: string;
    message?: string;
  }> | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const monthReadable = formatMonthReadable(record.billingMonth);

  // Previews
  const unit1Data =
    record.floor1Cost !== null
      ? {
          tenantName: settings.unit1Name,
          monthName: monthReadable,
          apartmentName: "Apartment 1",
          cost: record.floor1Cost ?? 0,
          totalBill: record.totalBill ?? 0,
          usage: record.floor1Usage,
          totalUsage: record.totalUsage,
          ratio: record.floor1Ratio,
        }
      : null;

  const unit2Data =
    record.floor2Cost !== null
      ? {
          tenantName: settings.unit2Name,
          monthName: monthReadable,
          apartmentName: "Apartment 2",
          cost: record.floor2Cost ?? 0,
          totalBill: record.totalBill ?? 0,
          usage: record.floor2Usage,
          totalUsage: record.totalUsage,
          ratio: record.floor2Ratio,
        }
      : null;

  const unit1SmsPreview = unit1Data ? formatSmsMessage(unit1Data) : "";
  const unit2SmsPreview = unit2Data ? formatSmsMessage(unit2Data) : "";
  const unit1SmsAddress =
    settings.unit1Phone && settings.unit1Carrier
      ? getEmailToSmsAddress(settings.unit1Phone, settings.unit1Carrier)
      : null;
  const unit2SmsAddress =
    settings.unit2Phone && settings.unit2Carrier
      ? getEmailToSmsAddress(settings.unit2Phone, settings.unit2Carrier)
      : null;

  const handleSend = async () => {
    setSending(true);
    setErrorMsg(null);
    setResults(null);

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: record.id,
          sendUnit1,
          sendUnit2,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send notifications");

      setIsSimulated(Boolean(data.simulated));
      setResults(data.results);
      if (data.record) {
        onSuccess(data.record);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Send Water Bill Notice — {monthReadable}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {results ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">
                  {isSimulated ? "Notification Dispatch Simulated Successfully" : "Notifications Dispatched!"}
                </p>
                {isSimulated && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    No `RESEND_API_KEY` was found in `.env`, so delivery was simulated in development mode.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Dispatch Details:</h4>
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center gap-2">
                    {r.channel === "sms" ? <Smartphone className="h-4 w-4 text-sky-500" /> : <Mail className="h-4 w-4 text-indigo-500" />}
                    <span className="font-medium">{r.unit} ({r.channel.toUpperCase()})</span>
                    <span className="text-slate-500 text-xs">{r.to}</span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "sent"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        : r.status === "simulated"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : r.status === "skipped"
                        ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white hover:bg-sky-700"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Unit 1 Review */}
            <div
              className={`rounded-lg border p-4 transition-all ${
                record.floor1Vacant
                  ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 opacity-70"
                  : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={sendUnit1}
                    disabled={record.floor1Vacant}
                    onChange={(e) => setSendUnit1(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Send to {settings.unit1Name}</span>
                </label>
                <span className="font-bold text-sky-600 dark:text-sky-400 text-lg">
                  ${record.floor1Cost?.toFixed(2) ?? "0.00"}
                </span>
              </div>

              {record.floor1Vacant ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Unit 1 is marked as vacant. Notification is disabled for this unit.
                </p>
              ) : (
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>Email: <strong>{settings.unit1NotifyEmail && settings.unit1Email ? settings.unit1Email : "Disabled or not set"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                    <span>SMS Gateway: <strong>{settings.unit1NotifySms && unit1SmsAddress ? unit1SmsAddress : "Disabled or not set"}</strong></span>
                  </div>
                  {unit1SmsPreview && (
                    <div className="mt-2 rounded bg-white p-2.5 border border-slate-200 font-mono text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      &quot;{unit1SmsPreview}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Unit 2 Review */}
            <div
              className={`rounded-lg border p-4 transition-all ${
                record.floor2Vacant
                  ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 opacity-70"
                  : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-900 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={sendUnit2}
                    disabled={record.floor2Vacant}
                    onChange={(e) => setSendUnit2(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Send to {settings.unit2Name}</span>
                </label>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                  ${record.floor2Cost?.toFixed(2) ?? "0.00"}
                </span>
              </div>

              {record.floor2Vacant ? (
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Unit 2 is marked as vacant. Notification is disabled for this unit.
                </p>
              ) : (
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>Email: <strong>{settings.unit2NotifyEmail && settings.unit2Email ? settings.unit2Email : "Disabled or not set"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-3.5 w-3.5 text-slate-400" />
                    <span>SMS Gateway: <strong>{settings.unit2NotifySms && unit2SmsAddress ? unit2SmsAddress : "Disabled or not set"}</strong></span>
                  </div>
                  {unit2SmsPreview && (
                    <div className="mt-2 rounded bg-white p-2.5 border border-slate-200 font-mono text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      &quot;{unit2SmsPreview}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-sky-50 p-3 text-xs text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                Carrier SMS messages will be delivered via free Email-to-SMS gateway addresses without carrier fees.
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={sending || (!sendUnit1 && !sendUnit2)}
                onClick={handleSend}
                className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white shadow-xs hover:bg-sky-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
