"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Pill,
  Check,
  X,
  Loader2,
  Database,
  PenTool,
  Info,
} from "lucide-react";
import type { EgyptianDrugMatch } from "@/types/drugs";

export interface DrugComboboxProps {
  value: string;
  onChange: (value: string, selectedDrug?: EgyptianDrugMatch) => void;
  onSelectDrug?: (drug: EgyptianDrugMatch) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function DrugCombobox({
  value,
  onChange,
  onSelectDrug,
  placeholder = "ابحث في 25,000+ دواء مصري أو اكتب يدوياً...",
  required = false,
  disabled = false,
  className = "",
  id = "drug-combobox",
}: DrugComboboxProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<EgyptianDrugMatch[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<EgyptianDrugMatch | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal query when external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch drugs with debounce
  const fetchDrugs = async (searchQuery: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/drugs/search?q=${encodeURIComponent(searchQuery)}&limit=15`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Error fetching drugs:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedMatch(null);
    onChange(val);
    setIsOpen(true);
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchDrugs(val);
    }, 180);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (results.length === 0) {
      fetchDrugs(query);
    }
  };

  const handleSelectDrug = (drug: EgyptianDrugMatch) => {
    const selectedText = drug.displayName;
    setQuery(selectedText);
    setSelectedMatch(drug);
    onChange(selectedText, drug);
    onSelectDrug?.(drug);
    setIsOpen(false);
  };

  const handleUseManualText = () => {
    onChange(query);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedMatch(null);
    onChange("");
    setResults([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && results[highlightedIndex]) {
        handleSelectDrug(results[highlightedIndex]);
      } else {
        handleUseManualText();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} dir="rtl">
      {/* Input Group */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
        />

        {/* Right Icon (Search / Pill) */}
        <div className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          ) : (
            <Pill className="w-4 h-4 text-teal-600" />
          )}
        </div>

        {/* Left Icons: Clear & Badge */}
        <div className="absolute left-2.5 flex items-center gap-1">
          {query && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-colors"
              title="مسح"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Database Verified Indicator */}
      {selectedMatch && (
        <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800/60 animate-in fade-in">
          <Database className="w-3 h-3 text-teal-600" />
          <span>دواء مسجل في السوق المصري:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {selectedMatch.scientificName || "تركيب دوائي معتمد"}
          </span>
          {selectedMatch.priceEgp !== null && (
            <span className="mr-auto font-bold text-emerald-600 dark:text-emerald-400">
              {selectedMatch.priceEgp} ج.م
            </span>
          )}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header pill: manual entry or database info */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300 font-bold">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>قاعدة الأدوية المصرية (25,000+ دواء)</span>
            </div>
            {query.trim() && (
              <button
                type="button"
                onClick={handleUseManualText}
                className="text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <PenTool className="w-3 h-3" />
                <span>إدخال يدوي مخصص</span>
              </button>
            )}
          </div>

          {/* Option: Accept Manual Custom Input */}
          {query.trim() && (
            <div
              onClick={handleUseManualText}
              className="p-3 hover:bg-amber-50/70 dark:hover:bg-amber-950/30 cursor-pointer flex items-center justify-between transition-colors text-amber-900 dark:text-amber-200 text-xs font-bold border-b border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-amber-600" />
                <span>استخدام الاسم كما كتبته يدوياً: &quot;{query}&quot;</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                إدخال يدوي
              </span>
            </div>
          )}

          {/* List of Matched Drugs */}
          {results.length > 0 ? (
            results.map((drug, idx) => {
              const isSelected = selectedMatch?.id === drug.id;
              const isHighlighted = highlightedIndex === idx;

              return (
                <div
                  key={drug.id || idx}
                  onClick={() => handleSelectDrug(drug)}
                  className={`p-3 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-teal-50/90 dark:bg-teal-950/60"
                      : isHighlighted
                      ? "bg-slate-100 dark:bg-slate-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {drug.nameAr ? `${drug.nameAr} - ${drug.nameEn}` : drug.nameEn}
                      </span>
                      {drug.route && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {drug.route}
                        </span>
                      )}
                    </div>

                    {drug.scientificName && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <span className="font-semibold text-teal-600 dark:text-teal-400">المادة الفعالة:</span>
                        <span>{drug.scientificName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      {drug.manufacturer && (
                        <span>الشركة: {drug.manufacturer}</span>
                      )}
                      {drug.priceEgp !== null && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {drug.priceEgp} ج.م
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          ) : !isLoading && query.trim() ? (
            <div className="p-4 text-center space-y-1">
              <p className="text-xs text-slate-500 font-medium">
                لم يتم العثور على دواء مسجل بهذا الاسم في قاعدة البيانات
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                يمكنك الضغط على خيار &quot;استخدام الاسم كما كتبته يدوياً&quot; لحفظه فوراً
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
