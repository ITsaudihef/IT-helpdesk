"use client";

import { useRef } from "react";
import { Search } from "lucide-react";
import { statusLabel, priorityLabel, typeLabel } from "@/lib/utils";

const FILTERS = [
  { name: "status",   label: "الحالة",   opts: ["OPEN","IN_PROGRESS","PENDING_DEPT_APPROVAL","PENDING_APPROVAL","WAITING_INFO","RESOLVED","CLOSED"] },
  { name: "priority", label: "الأولوية", opts: ["CRITICAL","HIGH","MEDIUM","LOW"] },
  { name: "type",     label: "النوع",    opts: ["SUPPORT","SHIFA_SUPPORT","DEVELOPMENT","INSTITUTIONAL_COMM"] },
];

interface Props {
  searchParams: { status?: string; priority?: string; type?: string; search?: string; department?: string; page?: string };
  departments?: string[];
}

export default function FilterForm({ searchParams, departments }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit  = () => formRef.current?.submit();

  return (
    <div className="rounded-xl border border-purple-100 p-3 sm:p-4" style={{ background: "#FFFFFF" }}>
      <form ref={formRef} className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
        {/* Search — full width on mobile */}
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
          <input name="search" defaultValue={searchParams.search}
            placeholder="بحث برقم أو عنوان التذكرة..."
            className="w-full pr-9 pl-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }} />
        </div>
        {/* Filters row */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <select key={f.name} name={f.name} defaultValue={(searchParams as any)[f.name] || ""}
              onChange={submit}
              className="flex-1 min-w-0 px-2 py-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }}>
              <option value="">كل {f.label}</option>
              {f.opts.map(o => (
                <option key={o} value={o}>
                  {statusLabel[o] || priorityLabel[o] || typeLabel[o] || o}
                </option>
              ))}
            </select>
          ))}

          {/* Department filter — only shown when departments provided */}
          {departments && departments.length > 0 && (
            <select name="department" defaultValue={searchParams.department || ""}
              onChange={submit}
              className="flex-1 min-w-0 px-2 py-2 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{ border: "1px solid #D1C4FE", background: "#FAFAFA", color: "#1F1535" }}>
              <option value="">كل الأقسام</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          <button type="submit"
            className="px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white whitespace-nowrap"
            style={{ background: "#7C3AED" }}>
            بحث
          </button>
        </div>
      </form>
    </div>
  );
}
