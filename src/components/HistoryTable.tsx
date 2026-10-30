"use client";

import { MonthRecord, TenantSettings } from "@/types";
import { History, Calendar, Trash2, Edit3, Send, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

interface HistoryTableProps {
  records: MonthRecord[];
  settings: TenantSettings;
  currentSelectedMonth: string;
  onSelectRecord: (billingMonth: string) => void;
  onDeleteRecord: (id: string, billingMonth: string) => void;
  onTriggerNotify: (record: MonthRecord) => void;
}

function formatMonthReadable(billingMonth: string): string {
  const [yearStr, monthStr] = billingMonth.split("-");
  const monthNum = parseInt(monthStr, 10);
  const date = new Date(parseInt(yearStr, 10), monthNum - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

export default function HistoryTable({
  records,
  settings,
  currentSelectedMonth,
  onSelectRecord,
  onDeleteRecord,
  onTriggerNotify,
}: HistoryTableProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
        <History className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="mt-3 text-base font-semibold text-slate-700 dark:text-slate-300">No Past Records Yet</h3>
        <p className="mt-1 text-sm text-slate-500">
          When you save monthly readings and bills above, they will appear here in chronological order.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Historical Month Records</h3>
        </div>
        <span className="text-xs text-slate-500">{records.length} records stored</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <th className="py-3.5 px-4">Billing Month</th>
              <th className="py-3.5 px-4">Meter Readings</th>
              <th className="py-3.5 px-4">Usage (Delta)</th>
              <th className="py-3.5 px-4">Total Bill</th>
              <th className="py-3.5 px-4">{settings.unit1Name}</th>
              <th className="py-3.5 px-4">{settings.unit2Name}</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {records.map((r) => {
              const isSelected = r.billingMonth === currentSelectedMonth;
              const hasBill = r.totalBill !== null && r.totalBill !== undefined;

              return (
                <tr
                  key={r.id}
                  className={`transition-colors hover:bg-slate-50/75 dark:hover:bg-slate-800/40 ${
                    isSelected ? "bg-sky-50/50 dark:bg-sky-950/20" : ""
                  }`}
                >
                  {/* Month */}
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>{formatMonthReadable(r.billingMonth)}</span>
                      {isSelected && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                          Editing
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Readings */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    <div>Total: <span className="font-semibold text-slate-900 dark:text-white">{r.totalMeter}</span></div>
                    <div>Floor 2: <span className="font-semibold text-slate-900 dark:text-white">{r.floor2Meter}</span></div>
                  </td>

                  {/* Usage */}
                  <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                    {r.totalUsage !== null && r.totalUsage !== undefined ? (
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.totalUsage} units total
                        </div>
                        <div className="text-[11px] text-slate-500">
                          F1: {r.floor1Usage} ({r.floor1Ratio ? `${(r.floor1Ratio * 100).toFixed(0)}%` : "--"}) | F2: {r.floor2Usage} ({r.floor2Ratio ? `${(r.floor2Ratio * 100).toFixed(0)}%` : "--"})
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No baseline</span>
                    )}
                  </td>

                  {/* Total Bill */}
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {hasBill ? `$${r.totalBill?.toFixed(2)}` : <span className="text-xs font-normal text-amber-600">Pending</span>}
                  </td>

                  {/* Unit 1 Cost */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {r.floor1Vacant ? (
                      <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        VACANT ($0.00)
                      </span>
                    ) : r.floor1Cost !== null && r.floor1Cost !== undefined ? (
                      <span className="font-bold text-sky-700 dark:text-sky-400">
                        ${r.floor1Cost.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">--</span>
                    )}
                  </td>

                  {/* Unit 2 Cost */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {r.floor2Vacant ? (
                      <span className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        VACANT ($0.00)
                      </span>
                    ) : r.floor2Cost !== null && r.floor2Cost !== undefined ? (
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        ${r.floor2Cost.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">--</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {r.status === "NOTIFIED" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Notified
                      </span>
                    ) : hasBill ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <Clock className="h-3 w-3" /> Awaiting Bill
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {hasBill && (
                        <button
                          onClick={() => onTriggerNotify(r)}
                          title="Send / Resend notification"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onSelectRecord(r.billingMonth)}
                        title="Edit in top card"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the record for ${formatMonthReadable(r.billingMonth)}?`)) {
                            onDeleteRecord(r.id, r.billingMonth);
                          }
                        }}
                        title="Delete record"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
