"use client";

import { useState } from "react";
import { TenantSettings } from "@/types";
import { CARRIERS } from "@/lib/carriers";
import { X, Save, Settings2, Smartphone, Mail } from "lucide-react";

interface TenantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TenantSettings;
  onSaved: (updated: TenantSettings) => void;
}

export default function TenantSettingsModal({
  isOpen,
  onClose,
  settings: initialSettings,
  onSaved,
}: TenantSettingsModalProps) {
  const [formData, setFormData] = useState<TenantSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      const data = await res.json();
      onSaved(data.settings);
      setStatusMsg({ type: "success", text: "Settings saved successfully!" });
      setTimeout(() => {
        onClose();
        setStatusMsg(null);
      }, 1000);
    } catch {
      setStatusMsg({ type: "error", text: "Error saving settings. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tenant & Notification Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Unit 1 */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                1
              </span>
              Apartment 1 (1st Floor)
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Tenant Name / Label</label>
                <input
                  type="text"
                  value={formData.unit1Name}
                  onChange={(e) => setFormData({ ...formData, unit1Name: e.target.value })}
                  placeholder="e.g. Unit 1"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={formData.unit1Email || ""}
                  onChange={(e) => setFormData({ ...formData, unit1Email: e.target.value })}
                  placeholder="tenant1@gmail.com"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Mobile Phone (for SMS)</label>
                <input
                  type="tel"
                  value={formData.unit1Phone || ""}
                  onChange={(e) => setFormData({ ...formData, unit1Phone: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Carrier (for free SMS gateway)</label>
                <select
                  value={formData.unit1Carrier || ""}
                  onChange={(e) => setFormData({ ...formData, unit1Carrier: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Select carrier...</option>
                  {CARRIERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex gap-6 text-sm text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.unit1NotifyEmail}
                  onChange={(e) => setFormData({ ...formData, unit1NotifyEmail: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-500" /> Send Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.unit1NotifySms}
                  onChange={(e) => setFormData({ ...formData, unit1NotifySms: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5 text-slate-500" /> Send SMS text</span>
              </label>
            </div>
          </div>

          {/* Unit 2 */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                2
              </span>
              Apartment 2 (2nd Floor)
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Tenant Name / Label</label>
                <input
                  type="text"
                  value={formData.unit2Name}
                  onChange={(e) => setFormData({ ...formData, unit2Name: e.target.value })}
                  placeholder="e.g. Unit 2"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Email Address</label>
                <input
                  type="email"
                  value={formData.unit2Email || ""}
                  onChange={(e) => setFormData({ ...formData, unit2Email: e.target.value })}
                  placeholder="tenant2@gmail.com"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Mobile Phone (for SMS)</label>
                <input
                  type="tel"
                  value={formData.unit2Phone || ""}
                  onChange={(e) => setFormData({ ...formData, unit2Phone: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Carrier (for free SMS gateway)</label>
                <select
                  value={formData.unit2Carrier || ""}
                  onChange={(e) => setFormData({ ...formData, unit2Carrier: e.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="">Select carrier...</option>
                  {CARRIERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex gap-6 text-sm text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.unit2NotifyEmail}
                  onChange={(e) => setFormData({ ...formData, unit2NotifyEmail: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-500" /> Send Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.unit2NotifySms}
                  onChange={(e) => setFormData({ ...formData, unit2NotifySms: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5 text-slate-500" /> Send SMS text</span>
              </label>
            </div>
          </div>

          {/* Sender config */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Sender Identity</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              The email address your tenants will see as the sender. For optimal deliverability to cell carriers, use an address on your dish.place domain.
            </p>
            <div className="mt-3 max-w-sm">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">From Email</label>
              <input
                type="text"
                value={formData.senderEmail || "water@dish.place"}
                onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                placeholder="water@dish.place"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {statusMsg && (
            <div
              className={`rounded-lg p-3 text-sm ${
                statusMsg.type === "success"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
              }`}
            >
              {statusMsg.text}
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
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-medium text-white shadow-xs hover:bg-sky-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
