"use client";

import React, { useState } from 'react';
import type { FamilyMember } from '@/types/med-record';
import { User, Users, Plus, Check, ChevronDown, Heart, ShieldAlert } from 'lucide-react';

interface FamilySwitcherProps {
  members: FamilyMember[];
  activeMemberId: string;
  onSelectMember: (id: string) => void;
  onAddMember?: () => void;
}

export function FamilySwitcher({
  members,
  activeMemberId,
  onSelectMember,
  onAddMember,
}: FamilySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeMember = members.find(m => m.id === activeMemberId) || members[0];

  const getRelationshipBadge = (m?: FamilyMember) => {
    if (!m) return '';
    if (m.isPrimary || m.relationship === 'self') return 'صاحب الحساب';
    if (m.relationshipLabel) return m.relationshipLabel;
    switch (m.relationship) {
      case 'child':
        return m.sex === 'female' ? 'ابنة' : 'ابن';
      case 'spouse':
        return m.sex === 'female' ? 'زوجة' : 'زوج';
      case 'parent':
        return m.sex === 'female' ? 'والدة' : 'والد';
      case 'sibling':
        return m.sex === 'female' ? 'أخت' : 'أخ';
      default:
        return 'فرد عائلة';
    }
  };

  return (
    <div className="relative inline-block text-right">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
            activeMember?.avatarColor || 'bg-emerald-600'
          }`}
        >
          {activeMember?.fullName.charAt(0) || 'م'}
        </div>
        <div className="text-right leading-tight">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span>{activeMember?.fullName}</span>
            <span className="text-[10px] font-normal px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {getRelationshipBadge(activeMember)}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            فصيلة الدم: <span className="font-semibold text-rose-600">{activeMember?.bloodType}</span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 mr-1" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in-50 zoom-in-95">
            <div className="px-3.5 py-2 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                أفراد العائلة
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto py-1">
              {members.map(member => {
                const isSelected = member.id === activeMemberId;
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      onSelectMember(member.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-right ${
                      isSelected ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                          member.avatarColor || 'bg-emerald-600'
                        }`}
                      >
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {member.fullName}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>{getRelationshipBadge(member)}</span>
                          <span>•</span>
                          <span className="text-rose-600 font-medium">{member.bloodType}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            {onAddMember && (
              <div className="pt-2 mt-1 border-t border-slate-100 px-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onAddMember();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة طفل أو فرد عائلة</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
