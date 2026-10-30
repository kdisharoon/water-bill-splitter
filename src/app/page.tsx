"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { MonthRecord, TenantSettings } from "@/types";
import CurrentMonthCard from "@/components/CurrentMonthCard";
import HistoryTable from "@/components/HistoryTable";
import TenantSettingsModal from "@/components/TenantSettingsModal";
import NotificationModal from "@/components/NotificationModal";
import { authClient } from "@/lib/auth/client";
import { AUTHORIZED_ADMIN_EMAIL } from "@/lib/auth/check";
import {
  Droplets,
  Settings,
  Globe,
  RefreshCw,
  User,
  LogOut,
  ShieldAlert,
  Lock,
} from "lucide-react";

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
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [notifyModalRecord, setNotifyModalRecord] = useState<MonthRecord | null>(null);

  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const isAuthenticated = Boolean(session?.user);
  const userEmail = session?.user?.email?.toLowerCase().trim();
  const isAuthorizedAdmin = isAuthenticated && userEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase().trim();

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

    if (isAuthorizedAdmin) {
      fetchRecordsAndSettings();
    }
  }, [isAuthorizedAdmin, fetchRecordsAndSettings]);

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

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: typeof window !== "undefined" ? window.location.origin : undefined,
      });
    } catch (err) {
      console.error("Sign in error:", err);
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  // 1. Loading state while checking session
  if (isSessionPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-500/20 animate-pulse">
            <Droplets className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state: Lock screen with Google Sign In
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-500/20 mb-4">
            <Droplets className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Water Bill Splitter</h1>
          <p className="mt-1 text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <Globe className="h-3.5 w-3.5 text-sky-500" />
            <span>water.dish.place</span>
          </p>

          <div className="my-6 border-t border-slate-100 dark:border-slate-800" />

          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60 dark:bg-slate-800/50 dark:border-slate-800 mb-6 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              <Lock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Admin Authentication Required</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This billing dashboard and tenant contact data are private and restricted to authorized management.
            </p>
          </div>

          <button
            type="button"
            disabled={signingIn}
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 shadow-xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {signingIn ? (
              <span className="text-xs text-slate-500">Redirecting to Google...</span>
            ) : (
              <>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // 3. Authenticated as someone else: Access Denied screen
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-xl dark:border-red-900/60 dark:bg-slate-900 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 shadow-sm mb-4">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h1>
          <p className="mt-2 text-xs text-slate-500">
            You are signed in as <strong className="text-slate-800 dark:text-slate-200">{session?.user?.email}</strong>.
          </p>

          <div className="my-5 rounded-xl bg-red-50 p-4 text-xs text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200/80 dark:border-red-900/50 text-left">
            This application is restricted. Your account does not have permission to access water bill records.
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Authorized admin (kdisharoon@gmail.com): Render full dashboard
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
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              <span>Tenant Settings</span>
            </button>

            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs dark:border-emerald-900 dark:bg-emerald-950/40">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-5 w-5 rounded-full"
                />
              ) : (
                <User className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="font-medium text-emerald-900 dark:text-emerald-200">
                {session?.user?.email}
              </span>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
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
