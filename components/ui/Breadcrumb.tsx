import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Crumb { label: string; href?: string; }

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-4" aria-label="breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9CA3AF" }} />}
          {c.href && i < crumbs.length - 1 ? (
            <Link href={c.href} className="hover:underline" style={{ color: "#7C3AED" }}>{c.label}</Link>
          ) : (
            <span style={{ color: i === crumbs.length - 1 ? "#1F1535" : "#7C3AED" }}>{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
