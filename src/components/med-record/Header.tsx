"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  FileText,
  Pill,
  Calendar,
  Syringe,
  FileSpreadsheet,
  AlertCircle,
  Home,
  Users,
  Building2,
  Settings,
} from 'lucide-react';
import { FamilySwitcher } from './FamilySwitcher';
import type { FamilyMember } from '@/types/med-record';

interface HeaderProps {
  members: FamilyMember[];
  activeMemberId: string;
  onSelectMember: (id: string) => void;
  onAddMember?: () => void;
}

export function Header({
  members,
  activeMemberId,
  onSelectMember,
  onAddMember,
}: HeaderProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'الرئيسية', icon: Home },
    { href: '/measurements', label: 'القياسات والنمو', icon: Activity },
    { href: '/documents', label: 'الوثائق والتحاليل', icon: FileText },
    { href: '/medications', label: 'الأدوية', icon: Pill },
    { href: '/visits', label: 'الزيارات', icon: Calendar },
    { href: '/vaccinations', label: 'التطعيمات', icon: Syringe },
    { href: '/report', label: 'تقرير الطبيب', icon: FileSpreadsheet },
    { href: `/emergency/${activeMemberId}`, label: 'طوارئ', icon: AlertCircle, isEmergency: true },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-emerald-700 transition-colors">
                  سجلي الطبي
                </div>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  Med Record • صحة عائلتك
                </div>
              </div>
            </Link>
          </div>

          {/* Center / Family Profile Switcher */}
          <div className="flex items-center gap-2">
            <FamilySwitcher
              members={members}
              activeMemberId={activeMemberId}
              onSelectMember={onSelectMember}
              onAddMember={onAddMember}
            />
          </div>

          {/* Right Navigation & Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    item.isEmergency
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="h-4 w-px bg-slate-200 mx-1" />

            <Link
              href="/settings"
              title="إعدادات الحساب وتصدير البيانات"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <Link
              href="/clinic"
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>بوابة العيادات</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Bar (Scrollable horizontally) */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  item.isEmergency
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
