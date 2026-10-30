"use client";

import { useState, useEffect, useMemo } from "react";
import { MonthRecord, TenantSettings } from "@/types";
import { calculateWaterBill } from "@/lib/calculations";
import {
  Calendar,
  Droplets,
  DollarSign,
  Send,
  Save,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Camera,
  FileText,
  Upload,
  ExternalLink,
} from "lucide-react";

interface CurrentMonthCardProps {
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  record: MonthRecord | null;
  previousRecord: MonthRecord | null;
  settings: TenantSettings;
  onSaveRecord: (savedRecord: MonthRecord) => void;
  onOpenNotifyModal: () => void;
}

export default function CurrentMonthCard({
  selectedMonth,
  onSelectMonth,
  record,
  previousRecord,
  settings,
  onSaveRecord,
  onOpenNotifyModal,
}: CurrentMonthCardProps) {
  // Local form inputs
  const [totalMeter, setTotalMeter] = useState<string>("");
  const [floor2Meter, setFloor2Meter] = useState<string>("");
  const [prevTotalMeter, setPrevTotalMeter] = useState<string>("");
  const [prevFloor2Meter, setPrevFloor2Meter] = useState<string>("");
  const [totalBill, setTotalBill] = useState<string>("");
  const [floor1Vacant, setFloor1Vacant] = useState<boolean>(false);
  const [floor2Vacant, setFloor2Vacant] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [meterPhotoKey, setMeterPhotoKey] = useState<string>("");
  const [meterPhotoUrl, setMeterPhotoUrl] = useState<string>("");
  const [billPdfKey, setBillPdfKey] = useState<string>("");
  const [billPdfUrl, setBillPdfUrl] = useState<string>("");
  const [uploadingMeter, setUploadingMeter] = useState<boolean>(false);
  const [uploadingBill, setUploadingBill] = useState<boolean>(false);
  const [showPrevOverride, setShowPrevOverride] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state whenever record or previousRecord changes
  useEffect(() => {
    if (record) {
      setTotalMeter(record.totalMeter !== undefined ? String(record.totalMeter) : "");
      setFloor2Meter(record.floor2Meter !== undefined ? String(record.floor2Meter) : "");
      setTotalBill(record.totalBill !== null && record.totalBill !== undefined ? String(record.totalBill) : "");
      setFloor1Vacant(Boolean(record.floor1Vacant));
      setFloor2Vacant(Boolean(record.floor2Vacant));
      setNotes(record.notes || "");
      setMeterPhotoKey(record.meterPhotoKey || "");
      setMeterPhotoUrl(record.meterPhotoUrl || "");
      setBillPdfKey(record.billPdfKey || "");
      setBillPdfUrl(record.billPdfUrl || "");
      setPrevTotalMeter(
        record.prevTotalMeter !== null && record.prevTotalMeter !== undefined
          ? String(record.prevTotalMeter)
          : previousRecord?.totalMeter !== undefined
          ? String(previousRecord.totalMeter)
          : ""
      );
      setPrevFloor2Meter(
        record.prevFloor2Meter !== null && record.prevFloor2Meter !== undefined
          ? String(record.prevFloor2Meter)
          : previousRecord?.floor2Meter !== undefined
          ? String(previousRecord.floor2Meter)
          : ""
      );
    } else {
      setTotalMeter("");
      setFloor2Meter("");
      setTotalBill("");
      setFloor1Vacant(false);
      setFloor2Vacant(false);
      setNotes("");
      setMeterPhotoKey("");
      setMeterPhotoUrl("");
      setBillPdfKey("");
      setBillPdfUrl("");
      setPrevTotalMeter(previousRecord?.totalMeter !== undefined ? String(previousRecord.totalMeter) : "");
      setPrevFloor2Meter(previousRecord?.floor2Meter !== undefined ? String(previousRecord.floor2Meter) : "");
    }
  }, [record, previousRecord, selectedMonth]);

  // Real-time calculation preview
  const liveCalculation = useMemo(() => {
    const tm = parseFloat(totalMeter);
    const f2m = parseFloat(floor2Meter);
    if (isNaN(tm) || isNaN(f2m)) return null;

    const ptm = prevTotalMeter !== "" ? parseFloat(prevTotalMeter) : null;
    const pf2m = prevFloor2Meter !== "" ? parseFloat(prevFloor2Meter) : null;
    const tb = totalBill !== "" ? parseFloat(totalBill) : null;

    return calculateWaterBill({
      totalMeter: tm,
      floor2Meter: f2m,
      prevTotalMeter: ptm,
      prevFloor2Meter: pf2m,
      totalBill: tb,
      floor1Vacant,
      floor2Vacant,
    });
  }, [totalMeter, floor2Meter, prevTotalMeter, prevFloor2Meter, totalBill, floor1Vacant, floor2Vacant]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, category: "meter" | "bill") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (category === "meter") setUploadingMeter(true);
    else setUploadingBill(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("billingMonth", selectedMonth);
      formData.append("category", category);

      const res = await fetch("/api/storage", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      if (category === "meter") {
        setMeterPhotoKey(data.key);
        setMeterPhotoUrl(data.url);
      } else {
        setBillPdfKey(data.key);
        setBillPdfUrl(data.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload file to Neon Object Storage.");
    } finally {
      if (category === "meter") setUploadingMeter(false);
      else setUploadingBill(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!totalMeter || !floor2Meter) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        billingMonth: selectedMonth,
        totalMeter: parseFloat(totalMeter),
        floor2Meter: parseFloat(floor2Meter),
        prevTotalMeter: prevTotalMeter !== "" ? parseFloat(prevTotalMeter) : null,
        prevFloor2Meter: prevFloor2Meter !== "" ? parseFloat(prevFloor2Meter) : null,
        totalBill: totalBill !== "" ? parseFloat(totalBill) : null,
        floor1Vacant,
        floor2Vacant,
        meterPhotoKey: meterPhotoKey || null,
        billPdfKey: billPdfKey || null,
        notes: notes || null,
      };

      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      onSaveRecord(data.record);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Error saving record.");
    } finally {
      setSaving(false);
    }
  };

  const status = record?.status || (liveCalculation?.status ?? "READINGS_NEEDED");
  const isReadyToSend = record && record.totalBill !== null && record.totalBill !== undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {/* Top Banner / Month Selection */}
      <div className="border-b border-slate-200 bg-linear-to-r from-sky-500/10 via-sky-500/5 to-transparent px-6 py-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-sky-500 p-2.5 text-white shadow-xs">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Current Month Entry</h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    status === "NOTIFIED"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : isReadyToSend
                      ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                      : totalMeter && floor2Meter
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {status === "NOTIFIED" ? (
                    <>
                      <CheckCircle className="h-3 w-3" /> Notified Tenants
                    </>
                  ) : isReadyToSend ? (
                    <>
                      <Sparkles className="h-3 w-3" /> Ready to Send
                    </>
                  ) : totalMeter && floor2Meter ? (
                    <>
                      <Clock className="h-3 w-3" /> Readings Saved — Awaiting Bill
                    </>
                  ) : (
                    "Readings Needed"
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter meter readings on 1st-2nd, then enter total bill amount on 5th-6th.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-xs focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* STEP 1: METER READINGS */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">
                  1
                </span>
                Meter Readings (1st – 2nd)
              </h3>
              <span className="text-xs font-medium text-slate-500">Water meter dials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Total Building Meter Reading
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 10540"
                    value={totalMeter}
                    onChange={(e) => setTotalMeter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Combines 1st & 2nd floor</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Floor 2 Separate Meter Reading
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 4120"
                    value={floor2Meter}
                    onChange={(e) => setFloor2Meter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Submeter for 2nd floor only</p>
              </div>
            </div>

            {/* Meter Photo Attachment (Neon Object Storage) */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <Camera className="h-4 w-4 text-sky-500" />
                  Meter Dial Photo
                </span>
                {meterPhotoUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={meterPhotoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
                    >
                      <span>View Photo</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setMeterPhotoKey("");
                        setMeterPhotoUrl("");
                      }}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 cursor-pointer dark:text-sky-400">
                    <Upload className="h-3 w-3" />
                    <span>{uploadingMeter ? "Uploading..." : "Attach Photo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingMeter}
                      onChange={(e) => handleUploadFile(e, "meter")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Baseline / Previous Month Reference */}
            <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowPrevOverride(!showPrevOverride)}
                className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                <span>
                  {prevTotalMeter
                    ? `Baseline from previous month: Total ${prevTotalMeter}, F2 ${prevFloor2Meter}`
                    : "Set baseline previous readings"}
                </span>
                {showPrevOverride ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showPrevOverride && (
                <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-white p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <div>
                    <label className="block text-[11px] text-slate-500">Prev Month Total Meter</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 10120"
                      value={prevTotalMeter}
                      onChange={(e) => setPrevTotalMeter(e.target.value)}
                      className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500">Prev Month Floor 2 Meter</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 3960"
                      value={prevFloor2Meter}
                      onChange={(e) => setPrevFloor2Meter(e.target.value)}
                      className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Live Usage Delta Display */}
            {liveCalculation?.totalUsage !== null && liveCalculation?.totalUsage !== undefined && (
              <div className="rounded-lg bg-sky-50/70 p-3 text-xs dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900">
                <div className="font-semibold text-sky-900 dark:text-sky-200">Calculated Water Consumption:</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded bg-white p-1.5 shadow-xs dark:bg-slate-800">
                    <div className="text-[10px] text-slate-500">Building Total</div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {liveCalculation.totalUsage} units
                    </div>
                  </div>
                  <div className="rounded bg-white p-1.5 shadow-xs dark:bg-slate-800">
                    <div className="text-[10px] text-slate-500">Floor 1 Usage</div>
                    <div className="font-bold text-sky-700 dark:text-sky-300">
                      {liveCalculation.floor1Usage} units
                    </div>
                  </div>
                  <div className="rounded bg-white p-1.5 shadow-xs dark:bg-slate-800">
                    <div className="text-[10px] text-slate-500">Floor 2 Usage</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-300">
                      {liveCalculation.floor2Usage} units
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: BILL & VACANCY */}
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  2
                </span>
                Total Bill & Vacancy (5th – 6th)
              </h3>
              <span className="text-xs font-medium text-slate-500">City water utility bill</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Total Water Bill Amount ($)
              </label>
              <div className="mt-1 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <DollarSign className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={totalBill}
                  onChange={(e) => setTotalBill(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xl font-bold text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Enter when received. Leave blank on 1st-2nd if only recording meter readings.
              </p>
            </div>

            {/* Bill Document Attachment (Neon Object Storage) */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  Utility Bill Statement (PDF / Image)
                </span>
                {billPdfUrl ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={billPdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      <span>View Statement</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setBillPdfKey("");
                        setBillPdfUrl("");
                      }}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer dark:text-emerald-400">
                    <Upload className="h-3 w-3" />
                    <span>{uploadingBill ? "Uploading..." : "Attach Statement"}</span>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      disabled={uploadingBill}
                      onChange={(e) => handleUploadFile(e, "bill")}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Vacancy Checkboxes */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-2">
                Apartment Vacancy Overrides
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={floor1Vacant}
                    onChange={(e) => {
                      setFloor1Vacant(e.target.checked);
                      if (e.target.checked) setFloor2Vacant(false);
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    <strong>{settings.unit1Name} is VACANT</strong> (Default 100% of bill to Floor 2)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={floor2Vacant}
                    onChange={(e) => {
                      setFloor2Vacant(e.target.checked);
                      if (e.target.checked) setFloor1Vacant(false);
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    <strong>{settings.unit2Name} is VACANT</strong> (Default 100% of bill to Floor 1)
                  </span>
                </label>
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500">Month Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Garden hose repairs, leak investigated, etc."
                className="mt-1 w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* CALCULATION RESULTS PREVIEW */}
        {liveCalculation && (
          <div className="rounded-xl border border-sky-200 bg-linear-to-br from-sky-50/50 to-white p-5 dark:border-slate-700 dark:from-slate-800/80 dark:to-slate-900">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Proportional Cost Breakdown Preview
            </h4>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unit 1 */}
              <div
                className={`rounded-xl border p-4 transition-all ${
                  floor1Vacant
                    ? "border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20"
                    : "border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{settings.unit1Name}</span>
                  {floor1Vacant && (
                    <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                      VACANT
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400">
                      ${liveCalculation.floor1Cost !== null ? liveCalculation.floor1Cost.toFixed(2) : "--"}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      Share:{" "}
                      <strong>
                        {liveCalculation.floor1Ratio !== null
                          ? `${(liveCalculation.floor1Ratio * 100).toFixed(1)}%`
                          : "--"}
                      </strong>
                    </div>
                    {liveCalculation.floor1Usage !== null && <div>Usage: {liveCalculation.floor1Usage} units</div>}
                  </div>
                </div>
              </div>

              {/* Unit 2 */}
              <div
                className={`rounded-xl border p-4 transition-all ${
                  floor2Vacant
                    ? "border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20"
                    : "border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{settings.unit2Name}</span>
                  {floor2Vacant && (
                    <span className="rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      VACANT
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ${liveCalculation.floor2Cost !== null ? liveCalculation.floor2Cost.toFixed(2) : "--"}
                    </span>
                  </div>
                  <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      Share:{" "}
                      <strong>
                        {liveCalculation.floor2Ratio !== null
                          ? `${(liveCalculation.floor2Ratio * 100).toFixed(1)}%`
                          : "--"}
                      </strong>
                    </div>
                    {liveCalculation.floor2Usage !== null && <div>Usage: {liveCalculation.floor2Usage} units</div>}
                  </div>
                </div>
              </div>
            </div>

            {liveCalculation.notes && (
              <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 italic">ℹ {liveCalculation.notes}</p>
            )}
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" /> Changes Saved!
              </span>
            )}
            {record?.readingsEnteredAt && (
              <span className="text-xs text-slate-500">
                Readings recorded: {new Date(record.readingsEnteredAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !totalMeter || !floor2Meter}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Save className="h-4 w-4 text-slate-500" />
              {saving ? "Saving..." : "Save Record"}
            </button>

            <button
              type="button"
              disabled={!isReadyToSend}
              onClick={onOpenNotifyModal}
              title={!isReadyToSend ? "Enter total bill amount and save before notifying" : "Send bill notice to tenants"}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed dark:disabled:bg-slate-800 dark:disabled:text-slate-500 transition-colors"
            >
              <Send className="h-4 w-4" />
              {status === "NOTIFIED" ? "Resend Notice to Tenants" : "Send Notice to Tenants"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
