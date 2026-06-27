"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Props { total: number; page: number; perPage: number; }

export default function Pagination({ total, page, perPage }: Props) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  const router    = useRouter();
  const pathname  = usePathname();
  const params    = useSearchParams();

  const go = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    router.push(`${pathname}?${sp.toString()}`);
  };

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-purple-100">
      <span className="text-xs" style={{ color: "#7C6A9E" }}>
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} من {total}
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => go(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-purple-50"
          style={{ color: "#7C3AED" }}>
          <ChevronRight className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-2 text-xs" style={{ color: "#9CA3AF" }}>…</span>
          ) : (
            <button key={p} onClick={() => go(p as number)}
              className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
              style={p === page
                ? { background: "#7C3AED", color: "#fff" }
                : { color: "#374151" }}>
              {p}
            </button>
          )
        )}
        <button onClick={() => go(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-purple-50"
          style={{ color: "#7C3AED" }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
