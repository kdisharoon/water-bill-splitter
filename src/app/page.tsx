"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { MonthRecord, TenantSettings } from "@/types";
import CurrentMonthCard from "@/components/CurrentMonthCard";
import HistoryTable from "@/components/HistoryTable";
import TenantSettingsModal from "@/components/TenantSettingsModal";
import NotificationModal from "@/components/NotificationModal";
import AuthModal from "@/components/AuthModal";
import { authClient } from "@/lib/auth/client";
import { Droplets, Settings, Globe, RefreshCw, User, LogIn, LogOut } from "lucide-react";

// Calculate previous month string (e.g. "2026-10" -> "2026-09")
function getPreviousMonthString(monthStr: string): string {
  if (!monthStr) return "";
  const [yearStr, mStr] = monthStr.split("-");
  let y = parseInt(yearStr, 10);
  let m = parseInt(mStr, 10) - 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export default function Home() {
  const [records, setRecords] = useState<MonthRecord[]>([]);
  const [settings, setSettings] = useState<TenantSettings>({
    id: "default",
    unit1Name: "Apartment 1 (1st Floor)",
    unit1Email: "",
    unit1Phone: "",
    unit1Carrier: "verizon",
    unit1NotifyEmail: true,
    unit1NotifySms: true,
    unit2Name: "Apartment 2 (2nd Floor)",
    unit2Email: "",
    unit2Phone: "",
    unit2Carrier: "verizon",
    unit2NotifyEmail: true,
    unit2NotifySms: true,
    senderEmail: "water@dish.place",
  });

  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [notifyModalRecord, setNotifyModalRecord] = useState<MonthRecord | null>(null);

  const { data: session } = authClient.useSession();

  const fetchRecordsAndSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/records");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    setSelectedMonth(`${year}-${month}`);
    fetchRecordsAndSettings();
  }, [fetchRecordsAndSettings]);

  // Find record for the currently selected month
  const currentRecord = useMemo(() => {
    return records.find((r) => r.billingMonth === selectedMonth) || null;
  }, [records, selectedMonth]);

  // Find the previous month's record to serve as the baseline
  const previousRecord = useMemo(() => {
    const prevMonthStr = getPreviousMonthString(selectedMonth);
    return records.find((r) => r.billingMonth === prevMonthStr) || null;
  }, [records, selectedMonth]);

  const handleSaveRecord = (savedRecord: MonthRecord) => {
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === savedRecord.id);
      let updated;
      if (exists) {
        updated = prev.map((r) => (r.id === savedRecord.id ? savedRecord : r));
      } else {
        updated = [savedRecord, ...prev];
      }
      return updated.sort((a, b) => b.billingMonth.localeCompare(a.billingMonth));
    });
  };

  const handleDeleteRecord = async (id: string, billingMonth: string) => {
    try {
      const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* App Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">Water Bill Splitter</h1>
                <span className="hidden items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 sm:inline-flex dark:bg-slate-800 dark:text-slate-300">
                  <Globe className="h-3 w-3 text-sky-500" />
                  water.dish.place
                </span>
              </div>
              <p className="text-xs text-slate-500">2-Apartment Proportional Submetering & Notifications</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchRecordsAndSettings()}
              title="Refresh records"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              <span>Tenant Settings</span>
            </button>

            {session?.user ? (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs dark:border-emerald-900 dark:bg-emerald-950/40">
                <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-emerald-900 dark:text-emerald-200">
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={async () => {
                    await authClient.signOut();
                  }}
                  title="Sign out"
                  className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-700"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-8">
        {/* CURRENT MONTH (TOP) */}
        <section>
          <CurrentMonthCard
            selectedMonth={selectedMonth}
            onSelectMonth={(m) => setSelectedMonth(m)}
            record={currentRecord}
            previousRecord={previousRecord}
            settings={settings}
            onSaveRecord={handleSaveRecord}
            onOpenNotifyModal={() => currentRecord && setNotifyModalRecord(currentRecord)}
          />
        </section>

        {/* HISTORICAL RECORDS (BOTTOM) */}
        <section>
          <HistoryTable
            records={records}
            settings={settings}
            currentSelectedMonth={selectedMonth}
            onSelectRecord={(m) => setSelectedMonth(m)}
            onDeleteRecord={handleDeleteRecord}
            onTriggerNotify={(rec) => setNotifyModalRecord(rec)}
          />
        </section>
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <TenantSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSaved={(newSettings) => setSettings(newSettings)}
      />

      {notifyModalRecord && (
        <NotificationModal
          isOpen={Boolean(notifyModalRecord)}
          onClose={() => setNotifyModalRecord(null)}
          record={notifyModalRecord}
          settings={settings}
          onSuccess={(updated) => {
            handleSaveRecord(updated);
          }}
        />
      )}
    </div>
  );
}
