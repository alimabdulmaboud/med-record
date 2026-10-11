import { t } from "@/lib/i18n";
import { ShieldCheck, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-purple-600 text-white font-bold text-lg flex items-center justify-center shadow-sm"
            >
              {t("app.name")}
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {t("admin.title")}
              </h1>
              <p className="text-xs text-slate-500">
                {t("roles.platform_admin")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
              <span>{t("common.back")}</span>
            </Link>

            <Link
              href="/login"
              className="text-xs text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("auth.signOut")}</span>
            </Link>
          </div>
        </div>

        {/* Mandatory Medical Privacy Banner */}
        <div
          data-testid="privacy-banner"
          className="bg-amber-50 border-t border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold">{t("admin.privacyBanner")}</span>
              <span className="hidden sm:inline text-amber-700">
                — {t("admin.privacyBannerDesc")}
              </span>
            </div>
            <span className="text-[11px] bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded border border-amber-300">
              No Clinical Access
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
